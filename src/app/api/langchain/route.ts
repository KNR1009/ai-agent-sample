import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    // チャットモデルの初期化（ストリーミング有効化）
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true, // ストリーミングを有効化
    });

    // メッセージのリストを定義
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "human", content: "こんにちは！私はジョンと言います！" },
      { role: "assistant", content: "こんにちは、ジョンさん！どのようにお手伝いできますか？" },
      { role: "human", content: "私は渋谷区渋谷3丁目に住んでいます" },
    ];

    // プロンプトテンプレートの作成
    const prompt = ChatPromptTemplate.fromMessages(messages);

    // ストリームを作成
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ストリーミング応答を取得
          const formattedMessages = await prompt.formatMessages({ input: question });
          const responseStream = await chat.stream(formattedMessages);

          // 応答を逐次的にクライアントに送信
          for await (const chunk of responseStream) {
            controller.enqueue(new TextEncoder().encode(chunk.text));
          }

          controller.close(); // ストリームを閉じる
        } catch (error) {
          controller.error(error); // エラー処理
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
