"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function FunctionCalling() {
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFunctionCall = async () => {
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/function-calling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "東京の天気を教えて" }
          ]
        }),
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

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Function Calling Demo</h1>

      <button
        onClick={handleFunctionCall}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded
          ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
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
          '天気を確認'
        )}
      </button>

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
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">レスポンス</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-x-auto text-sm whitespace-pre-wrap">
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
