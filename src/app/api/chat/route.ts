import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// トークン数の制限
const MAX_TOKENS = 4000;

// 簡易的なトークン数計算とメッセージの制限
const trimMessages = (messages: any[]): any[] => {
  let totalTokens = 0;
  return messages.reverse().filter(msg => {
    const estimatedTokens = msg.content.length / 4;
    totalTokens += estimatedTokens;
    return totalTokens < MAX_TOKENS;
  }).reverse();
};

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // トークン数を制限したメッセージを使用
    const trimmedMessages = trimMessages(messages);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: trimmedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
