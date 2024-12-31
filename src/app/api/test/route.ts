import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // プロンプトテンプレートの作成
    const systemTemplate = `
あなたは親切なアシスタントです。
以下のガイドラインに従って回答してください：
- 丁寧で分かりやすい日本語で回答
- 専門用語を使う場合は説明を追加
- 必要に応じて箇条書きを使用
`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemTemplate],
      ...messages.map((m: any) => [m.role, m.content]),
    ]);

    // チェーンの作成
    const chain = RunnableSequence.from([
      chatPrompt,
      chat,
      new StringOutputParser(),
    ]);

    // 応答の生成
    const response = await chain.invoke({});

    return NextResponse.json({
      choices: [{
        message: {
          content: response,
          role: "assistant"
        }
      }]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
