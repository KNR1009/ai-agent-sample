import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
import path from 'path';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // 1. テキストファイルをロード
    const filePath = path.join(process.cwd(), 'public', 'data', 'context.txt');
    const loader = new TextLoader(filePath);
    const [doc] = await loader.load();

    // 2. Text Splitterを使用してチャンクに分割
    const textSplitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });

    const splitDocs = await textSplitter.splitDocuments([doc]);
    const contextText = splitDocs.map(doc => doc.pageContent).join('\n\n');

    // 3. ChatOpenAIの設定
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4",
      temperature: 0.7,
    });

    const systemTemplate = `
以下のコンテキストを参考に、ユーザーの質問に答えてください：

${contextText}

回答は以下のガイドラインに従ってください：
- 丁寧で分かりやすい日本語で回答
- 専門用語を使う場合は説明を追加
- 必要に応じて箇条書きを使用
- 与えられたコンテキストの情報を活用して回答
`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemTemplate],
      ["human", messages[messages.length - 1].content],
    ]);

    const chain = RunnableSequence.from([
      chatPrompt,
      chat,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("エラー:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
