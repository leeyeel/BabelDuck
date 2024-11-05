'use client'
import { i18nText } from "@/app/i18n/i18n"
import { createOpenAI } from "@ai-sdk/openai"
import { convertToCoreMessages, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

// ================================ api ================================

export type LLMServiceRecord = {
    id: string
} & LLMService

export type LLMService = {
    type: string
    name: i18nText
    deletable: boolean
    settings: object
}

export function getLLMServices(): LLMServiceRecord[] {
    // default services + user defined services
    return getDefaultLLMServices()
}

// side effect: if some default services missing in local storage, they will be saved to local storage
export function getDefaultLLMServices(): LLMServiceRecord[] {
    const defaultLLMServices: Record<string, LLMService> = {
        openai: {
            type: 'openai',
            name: { text: 'OpenAI' },
            deletable: false,
            settings: OpenAIService.defaultSettings,
        },
        siliconflow: {
            type: 'siliconflow',
            name: { text: 'SiliconFlow' },
            deletable: false,
            settings: SiliconFlowService.defaultSettings,
        }
    }
    const defaultLLMServicesFromStorage = _getDefaultLLMServicesFromLocalStorage()
    const inStorageServicesNumber = defaultLLMServicesFromStorage.length
    // append the services in defaultLLMServices that are not in defaultLLMServicesFromStorage
    for (const serviceId of Object.keys(defaultLLMServices)) {
        if (!defaultLLMServicesFromStorage.some((s) => s.id === serviceId)) {
            defaultLLMServicesFromStorage.push({ id: serviceId, ...defaultLLMServices[serviceId] })
        }
    }
    if (defaultLLMServicesFromStorage.length !== inStorageServicesNumber) {
        _saveDefaultLLMServicesToLocalStorage(defaultLLMServicesFromStorage)
    }
    return defaultLLMServicesFromStorage
}

export function updateLLMServiceSettings(serviceId: string, settings: object) {
    const defaultLLMServices = getLLMServices()
    const service = defaultLLMServices.find((s) => s.id === serviceId)
    if (service) {
        service.settings = settings
        _saveDefaultLLMServicesToLocalStorage(defaultLLMServices)
    }
}

// ================================ local storage ================================

function _getDefaultLLMServicesFromLocalStorage(): LLMServiceRecord[] {
    const defaultLLMServices = localStorage.getItem('defaultLLMServices')
    if (defaultLLMServices) {
        return JSON.parse(defaultLLMServices)
    }
    return []
}

function _saveDefaultLLMServicesToLocalStorage(defaultLLMServices: LLMServiceRecord[]) {
    localStorage.setItem('defaultLLMServices', JSON.stringify(defaultLLMServices))
}

// ================================ LLM Service implementations ================================

export class OpenAICompatibleAPIService {
    baseUrl: string
    apiKey: string
    chatCompletionModel: string
    static type = 'openai-compatible-api'

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

export class OpenAIService extends OpenAICompatibleAPIService {
    host: string = 'https://api.openai.com'
    static type = 'openai'
    static availableChatModels = [
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'gpt-3.5-turbo-1106',
        'gpt-3.5-turbo-0125',
        'gpt-3.5-turbo-0613',
        'gpt-3.5-turbo-16k-0613',
        'gpt-3.5-turbo-0301',
        'gpt-4',
        'gpt-4-0613',
        'gpt-4-0314',
        'gpt-4-32k',
        'gpt-4-32k-0613',
        'gpt-4-32k-0314',
        'gpt-4-turbo',
        'gpt-4-turbo-2024-04-09',
        'gpt-4-turbo-preview',
        'gpt-4-1106-preview',
        'gpt-4-0125-preview',
        'gpt-4-vision-preview',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4o-2024-05-13',
        'gpt-4o-2024-08-06',
        'gpt-4o-mini-2024-07-18',
        'chatgpt-4o-latest',
        'o1-preview',
        'o1-preview-2024-09-12',
        'o1-mini',
        'o1-mini-2024-09-12'
    ]
    static defaultSettings: OpenAISettings = {
        baseURL: 'https://api.openai.com',
        apiKey: '',
        chatCompletionModel: 'gpt-4o-mini',
    }

    constructor(host: string, apiKey: string, chatCompletionModel: string) {
        super(host, apiKey, chatCompletionModel)
        this.host = host
    }
}

export type OpenAISettings = {
    baseURL: string
    apiKey: string
    chatCompletionModel: string
}

export class SiliconFlowService extends OpenAICompatibleAPIService {
    static type = 'siliconflow'

    constructor(apiKey: string, chatCompletionModel: string) {
        super(SiliconFlowService.defaultHost, apiKey, chatCompletionModel)
    }

    static defaultHost = 'https://api.siliconflow.cn'

    static availableChatModels = ['deepseek-ai/DeepSeek-V2.5']

    static defaultSettings: OpenAISettings = {
        baseURL: SiliconFlowService.defaultHost,
        apiKey: '',
        chatCompletionModel: 'deepseek-ai/DeepSeek-V2.5',
    }
}
