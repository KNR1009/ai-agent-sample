import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// 天気を取得する関数の定義
const getCurrentWeather = async (location: string) => {
  // 実際のAPI呼び出しの代わりにモックデータを返す
  return {
    location,
    temperature: "22",
    unit: "celsius",
    description: "晴れ"
  };
};

// 利用可能な関数の定義
const functions = [
  {
    name: "get_current_weather",
    description: "指定された場所の現在の天気を取得",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "都市名（例：東京、大阪）",
        },
      },
      required: ["location"],
    },
  },
];

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      functions: functions,  // toolsをfunctionsに変更
      function_call: "auto", // tool_choiceをfunction_callに変更
    });

    // Function callingの結果を確認
    const responseMessage = response.choices[0].message;

    // 関数の呼び出しが要求された場合
    if (responseMessage.tool_calls) {
      const functionCall = responseMessage.tool_calls[0];
      const functionName = functionCall.function.name;
      const functionArgs = JSON.parse(functionCall.function.arguments);

      let functionResponse;
      if (functionName === 'get_current_weather') {
        functionResponse = await getCurrentWeather(functionArgs.location);
      }

      // 関数の実行結果を含めて再度APIを呼び出す
      const secondResponse = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          ...messages,
          responseMessage,
          {
            role: "function",
            name: functionName,
            content: JSON.stringify(functionResponse),
          },
        ],
      });

      return NextResponse.json(secondResponse);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
