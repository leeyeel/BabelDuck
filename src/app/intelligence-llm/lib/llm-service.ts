import { i18nText } from "@/app/i18n/i18n"
import { createOpenAI } from "@ai-sdk/openai"
import { convertToCoreMessages, streamText } from 'ai';

// ================================ business logic ================================

export type LLMServiceSettingsRecord = {
    id: string
} & LLMServiceSettings

export type LLMServiceSettings = {
    type: string
    name: i18nText
    deletable: boolean
    settings: object
}

export function getLLMServiceSettings(): LLMServiceSettingsRecord[] {
    // built-in services + user defined services
    return getBuiltInLLMServicesSettings()
}

// side effect: if some built-in services missing in local storage, they will be saved to local storage
export function getBuiltInLLMServicesSettings(): LLMServiceSettingsRecord[] {
    const builtInLLMServices: Record<string, LLMServiceSettings> = {
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
    const builtInLLMServicesFromStorage = _getBuiltInLLMServicesFromLocalStorage()
    const inStorageServicesNumber = builtInLLMServicesFromStorage.length
    // append the services in builtInLLMServices that are not in builtInLLMServicesFromStorage
    for (const serviceId of Object.keys(builtInLLMServices)) {
        if (!builtInLLMServicesFromStorage.some((s) => s.id === serviceId)) {
            builtInLLMServicesFromStorage.push({ id: serviceId, ...builtInLLMServices[serviceId] })
        }
    }
    if (builtInLLMServicesFromStorage.length !== inStorageServicesNumber) {
        _saveBuiltInLLMServicesToLocalStorage(builtInLLMServicesFromStorage)
    }
    return builtInLLMServicesFromStorage
}

export function updateLLMServiceSettings(serviceId: string, settings: object) {
    const builtInLLMServices = getLLMServiceSettings()
    const service = builtInLLMServices.find((s) => s.id === serviceId)
    if (service) {
        service.settings = settings
        _saveBuiltInLLMServicesToLocalStorage(builtInLLMServices)
    }
}

export function getLLMServiceSettingsRecord(serviceId: string): LLMServiceSettingsRecord | undefined {
    return getLLMServiceSettings().find((s) => s.id === serviceId)
}

// ================================ local storage ================================

function _getBuiltInLLMServicesFromLocalStorage(): LLMServiceSettingsRecord[] {
    const builtInLLMServices = localStorage.getItem('builtInLLMServices')
    if (builtInLLMServices) {
        return JSON.parse(builtInLLMServices)
    }
    return []
}

function _saveBuiltInLLMServicesToLocalStorage(builtInLLMServices: LLMServiceSettingsRecord[]) {
    localStorage.setItem('builtInLLMServices', JSON.stringify(builtInLLMServices))
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

        const stream = streamText({
            model: openai.chat(this.chatCompletionModel),
            messages: convertToCoreMessages(messageList as { role: 'system' | 'user' | 'assistant', content: string }[]),
        })
        return stream
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

    static deserialize(settings: object): OpenAIService {
        // Type guard to check if settings matches OpenAISettings structure
        const isOpenAISettings = (obj: object): obj is OpenAISettings => {
            return 'baseURL' in obj && typeof obj.baseURL === 'string' &&
                'apiKey' in obj && typeof obj.apiKey === 'string' &&
                'chatCompletionModel' in obj && typeof obj.chatCompletionModel === 'string';
        }

        if (!isOpenAISettings(settings)) {
            throw new Error('Invalid OpenAI settings');
        }

        return new OpenAIService(settings.baseURL, settings.apiKey, settings.chatCompletionModel);
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
