import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    // チャットモデルの初期化
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // プロンプトテンプレートの作成
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "あなたは親切なアシスタントです。簡潔で分かりやすい回答を心がけてください。"],
      ["human", "{input}"],
    ]);

    // チェーンの作成と実行
    const chain = prompt.pipe(chat).pipe(new StringOutputParser());

    const response = await chain.invoke({
      input: question,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
