'use server'
import { createStreamableValue } from "ai/rsc";
import { createOpenAI } from "@ai-sdk/openai";
import { SiliconFlowService } from "./llm-service";
import { convertToCoreMessages, streamText } from "ai";

// to hide the api key for free trial, we need to move this to the server side
export const freeTrialChatCompletionInStream = async (
    messageList: { role: string, content: string }[],
) => {
    if (!process.env.SILICONFLOW_API_KEY) {
        throw new Error('SILICONFLOW_API_KEY is not defined');
    }
    const siliconFlowService = new SiliconFlowService(process.env.SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V2.5');
    const tmp = siliconFlowService.chatCompletionInStream(messageList);
    const streamableStatus = createStreamableValue<string>();
    (async () => {
        for await (const chunk of (await tmp).textStream) {
            streamableStatus.update(chunk);
        }
        streamableStatus.done();
    })();

    return {
        status: streamableStatus.value,
    };
};