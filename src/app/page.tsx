"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');

  const handleChat = async () => {
    if (!question.trim()) {
      setError('質問を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
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
      <h1 className="text-2xl font-bold mb-4">LangChain Chat Demo</h1>

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

      {response && (
        <div className="space-y-4 mt-8">
          <div className="p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">質問</h2>
            <p className="text-gray-700">{question}</p>
          </div>

          {/* マークダウン形式での回答表示 */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">回答</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>
                {getMessageContent(JSON.parse(response)) || '応答の解析に失敗しました。'}
              </ReactMarkdown>
            </div>
          </div>

          {/* JSON形式での詳細表示 */}
          <div>
            <h2 className="text-lg font-semibold mb-2">詳細なレスポンス</h2>
            <pre className="p-4 bg-gray-100 rounded overflow-x-auto text-sm">
              {response}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

// ローディングスピナーコンポーネント
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
