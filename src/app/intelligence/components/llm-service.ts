
import { createOpenAI } from "@ai-sdk/openai"
import { convertToCoreMessages, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

export class OpenAILikeService {
    baseUrl: string
    apiKey: string
    chatCompletionModel: string

    constructor(baseUrl: string, apiKey: string, chatCompletionModel: string) {
        this.baseUrl = baseUrl
        this.apiKey = apiKey
        this.chatCompletionModel = chatCompletionModel
    }

    chatCompletionInStream(messageList: { role: string, content: string }[]) {
        const openai = createOpenAI({
            baseURL: this.baseUrl,
            apiKey: this.apiKey,
        })

        const result = streamText({
            model: openai.chat(this.chatCompletionModel),
            messages: convertToCoreMessages(messageList as { role: 'system' | 'user' | 'assistant', content: string }[]),
        })

        const streamableStatus = createStreamableValue<string>();
        (async () => {
            for await (const chunk of (await result).textStream) {
                streamableStatus.update(chunk);
            }
            streamableStatus.done();
        })();

        return {
            status: streamableStatus.value,
        };
    }
}

export class OpenAIService extends OpenAILikeService {
    host: string = 'https://api.openai.com'

    constructor(host: string, apiKey: string, chatCompletionModel: string) {
        super(host, apiKey, chatCompletionModel)
        this.host = host
    }

}

export class SiliconFlowService extends OpenAILikeService {

    constructor(apiKey: string, chatCompletionModel: string) {
        super(SiliconFlowService.defaultHost, apiKey, chatCompletionModel)
    }

    static defaultHost = 'https://api.siliconflow.cn'

    static availableChatModels = ['deepseek-ai/DeepSeek-V2.5']
}