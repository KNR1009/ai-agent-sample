import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import path from 'path';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const userQuestion = messages[messages.length - 1].content;

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

    // 3. Embeddingsの作成とベクトルストアの構築
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // ベクトル化の例を表示
    const sampleEmbedding = await embeddings.embedQuery(userQuestion);
    console.log("=== ユーザー質問のembedding ===");
    console.log("次元数:", sampleEmbedding.length);
    console.log("ベクトル値（最初の5次元）:", sampleEmbedding.slice(0, 5));

    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );

    // 各チャンクのembeddingを表示
    console.log("\n=== 各チャンクのembedding ===");
    for (let i = 0; i < splitDocs.length; i++) {
      const docEmbedding = await embeddings.embedQuery(splitDocs[i].pageContent);
      console.log(`チャンク ${i + 1}:`);
      console.log("次元数:", docEmbedding.length);
      console.log("ベクトル値（最初の5次元）:", docEmbedding.slice(0, 5));
    }

    // 4. 類似度検索の実行
    const relevantDocs = await vectorStore.similaritySearch(userQuestion, 2);
    const contextText = relevantDocs.map(doc => doc.pageContent).join('\n\n');


    // 5. ChatOpenAIの設定
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
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
      ["human", userQuestion],
    ]);

    const chain = RunnableSequence.from([
      chatPrompt,
      chat,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    return NextResponse.json({
      response,
      relevantChunks: relevantDocs.map(doc => doc.pageContent)
    });
  } catch (error: any) {
    console.error("エラー:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
