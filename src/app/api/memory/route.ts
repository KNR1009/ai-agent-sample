import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

// メモリーのインスタンスをグローバルに保持
// 注意: この方法は開発用です。実運用ではRedisやデータベースを使用することを推奨
let memory = new BufferMemory();

export async function POST(request: Request) {
  try {
    const { message, clearHistory } = await request.json();

    // 履歴をクリアするリクエストの場合
    if (clearHistory) {
      memory = new BufferMemory();
      return NextResponse.json({ response: "会話履歴をクリアしました。" });
    }

    // ChatGPTモデルの初期化
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // 会話チェーンの作成
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
      // プロンプトテンプレートをカスタマイズ
      prompt: ChatPromptTemplate.fromTemplate(`
現在の会話の履歴: {history}

人間: {input}

以下の制約に従って回答してください：
- 簡潔で分かりやすい日本語で回答
- 必要に応じて過去の会話を参照
- 箇条書きを使って整理された形で回答

アシスタント: `),
    });


    // チェーン実行して応答を取得
    const response = await chain.call({
      input: message,
    });

    return NextResponse.json({ response: response.response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
