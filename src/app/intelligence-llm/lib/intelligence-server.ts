'use server'
import { SiliconFlowService } from "./llm-service";

// to hide the api key for free trial, we need to move this to the server side
export const freeTrialChatCompletionInStream = async (
    messageList: { role: string, content: string }[],
) => {
    if (!process.env.SILICONFLOW_API_KEY) {
        throw new Error('SILICONFLOW_API_KEY is not defined');
    }
    const siliconFlowService = new SiliconFlowService(process.env.SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V2.5');
    return siliconFlowService.chatCompletionInStream(messageList);
};