"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// メッセージの型定義
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// 会話履歴の保存
const saveMessages = (messages: Message[]) => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
};

// 会話履歴の読み込み
const loadMessages = (): Message[] => {
  if (typeof window === 'undefined') return [
    { role: 'system', content: 'You are a helpful assistant.' }
  ];

  const saved = localStorage.getItem('chatHistory');
  return saved ? JSON.parse(saved) : [
    { role: 'system', content: 'You are a helpful assistant.' }
  ];
};

export default function Home() {
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>(loadMessages());

  // メッセージ更新時に保存
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleChat = async () => {
    if (!question.trim()) {
      setError('質問を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    const newUserMessage: Message = { role: 'user', content: question };
    const currentMessages = [...messages, newUserMessage];

    console.log(currentMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data?.choices?.[0]?.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.choices[0].message.content
        };
        setMessages([...currentMessages, assistantMessage]);
      }

      setResponse(JSON.stringify(data, null, 2));
      setQuestion('');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChat();
  };

  const clearHistory = () => {
    setMessages([
      { role: 'system', content: 'You are a helpful assistant.' }
    ]);
    localStorage.removeItem('chatHistory');
    setResponse('');
    setError('');
  };

  const getMessageContent = (response: any) => {
    try {
      if (response?.choices?.[0]?.message?.content) {
        return response.choices[0].message.content;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">LangChain Chat Demo</h1>
        <button
          onClick={clearHistory}
          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
        >
          履歴をクリア
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            質問を入力してください
          </label>
          <div className="flex gap-2">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ここに質問を入力..."
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className={`
            px-4 py-2 rounded w-full
            ${isLoading || !question.trim()
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }
            text-white transition-colors
            flex items-center justify-center gap-2
          `}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              処理中...
            </>
          ) : (
            '質問を送信'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 p-4 bg-gray-50 rounded animate-pulse">
          応答を待っています...
        </div>
      )}

      {/* 会話履歴の表示 */}
      <div className="space-y-4 mt-8">
        {messages.slice(1).map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${message.role === 'user'
              ? 'bg-blue-50'
              : 'bg-gray-50'
              }`}
          >
            <div className="font-semibold mb-2">
              {message.role === 'user' ? '質問' : '回答'}
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {response && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">詳細なレスポンス</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-x-auto text-sm">
            {response}
          </pre>
        </div>
      )}
    </main>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
