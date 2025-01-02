import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BufferMemory } from "langchain/memory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import path from 'path';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // テキストファイルのロード
    const filePath = path.join(process.cwd(), 'public', 'data', 'context.txt');
    const loader = new TextLoader(filePath);
    const [doc] = await loader.load();

    // メモリの初期化
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "output",
    });

    // テキストファイルの内容をメモリに初期コンテキストとして保存
    await memory.saveContext(
      { input: "システム: 以下は重要な背景情報です" },
      { output: doc.pageContent }
    );

    // 会話履歴の処理
    interface ConversationPair {
      input: string;
      output: string;
    }

    const conversationPairs = messages.slice(0, -1).reduce((pairs: any[], msg: any, index: number) => {
      if (msg.role === 'user' && messages[index + 1]?.role === 'assistant') {
        pairs.push({
          input: msg.content,
          output: messages[index + 1].content
        });
      }
      return pairs;
    }, []);

    await Promise.all(
      conversationPairs.map((pair: ConversationPair) =>
        memory.saveContext(
          { input: pair.input },
          { output: pair.output }
        )
      )
    );

    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    const systemTemplate = `
あなたは親切なアシスタントです。
以下のガイドラインに従って回答してください：
- 丁寧で分かりやすい日本語で回答
- 専門用語を使う場合は説明を追加
- 必要に応じて箇条書きを使用
- ユーザーの過去の情報を参照して回答
- 背景情報ファイルの内容を考慮して回答

これまでの会話履歴と背景情報: {history}
`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemTemplate],
      ["human", messages[messages.length - 1].content],
    ]);

    const chain = RunnableSequence.from([
      async (input) => {
        const history = await memory.loadMemoryVariables({});
        return {
          ...input,
          history: history.history,
        };
      },
      chatPrompt,
      chat,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    console.log(response)

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
