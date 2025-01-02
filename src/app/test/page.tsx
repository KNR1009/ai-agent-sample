"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

type ResponseData = {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
};

export default function TestChat() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: input }
          ]
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      setResponse(data);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LangChain チャット</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded-lg"
          rows={4}
          placeholder="メッセージを入力..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`w-full p-2 rounded-lg text-white ${isLoading || !input.trim()
            ? 'bg-gray-400'
            : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? '送信中...' : '送信'}
        </button>
      </form>

      {isLoading && (
        <div className="mt-4 p-4 bg-gray-50 rounded animate-pulse">
          回答を生成しています...
        </div>
      )}

      {response && (
        <div className="space-y-6 mt-4">
          {/* フォーマットされた回答 */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">フォーマットされた回答:</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>{response.choices[0].message.content}</ReactMarkdown>
            </div>
          </div>

          {/* 生のJSONデータ */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-white">レスポンスの生データ:</h2>
            <pre className="overflow-auto p-2 bg-gray-900 rounded text-green-400 text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
