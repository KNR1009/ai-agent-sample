"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// メッセージの型定義
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function LangChainMemoryDemo() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // メッセージ送信の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('メッセージを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 新しいメッセージを追加
      const newMessage: Message = { role: 'user', content: message };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // アシスタントの応答を追加
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴をクリアする処理
  const handleClearHistory = async () => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clearHistory: true }),
      });
      setMessages([]);
    } catch (err) {
      console.error('Error:', err);
      setError('履歴のクリアに失敗しました');
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">LangChain Memory Demo</h1>
        <button
          onClick={handleClearHistory}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          履歴をクリア
        </button>
      </div>

      {/* メッセージ履歴の表示 */}
      <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${msg.role === 'user'
              ? 'bg-blue-100 ml-auto max-w-[80%]'
              : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
          >
            <div className="prose max-w-none">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="メッセージを入力..."
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className={`
            px-4 py-2 rounded w-full
            ${isLoading || !message.trim()
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }
            text-white transition-colors
            flex items-center justify-center gap-2
          `}
        >
          {isLoading ? '送信中...' : '送信'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </main>
  );
}
