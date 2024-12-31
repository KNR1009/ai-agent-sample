"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const initialMessage: Message = {
  role: 'system',
  content: 'あなたは親切なアシスタントです。'
};

export default function TestChat() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LangChain チャット</h1>

      <div className="mb-4 space-y-4">
        {messages.slice(1).map((message, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
          >
            <div className="font-bold mb-2">
              {message.role === 'user' ? 'あなた' : 'アシスタント'}
            </div>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ))}
      </div>

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
    </div>
  );
}
