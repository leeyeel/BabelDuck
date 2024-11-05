

import { i18nText } from "@/app/i18n/i18n"
import { isOpenAILikeMessage, Message } from "@/app/chat/lib/message"
import { freeTrialChatCompletionInStream } from "./intelligence-server"
import { SpecialRoles, TextMessage } from "@/app/chat/components/message"
import { StreamingTextMessage } from "@/app/chat/components/message"
import { readStreamableValue } from "ai/rsc"
import { _getDefaultChatIntelligencesFromLocalStorage, _saveDefaultChatIntelligencesToLocalStorage } from "./intelligence-persistence"

// ============================= business logic =============================

export type chatIntelligenceSettingsRecord = {
    id: string
} & chatIntelligenceSettings

export type chatIntelligenceSettings = {
    name: i18nText
    type: string
    settings: object
}

// abstract class dynamicChatIntelligenceSettings {
//     type: string
//     payload: object
//     constructor(type: string, payload: object) {
//         this.type = type
//         this.payload = payload
//     }
//     abstract settings(): object
// }

export function getChatIntelligenceSettingsByID(id: string): chatIntelligenceSettingsRecord {
    const availableIntelligences = getAvailableChatIntelligenceSettings()
    const intelligence = availableIntelligences.find(i => i.id === id)
    if (!intelligence) {
        throw new Error(`Intelligence with id ${id} not found`)
    }
    return intelligence
}

export function getAvailableChatIntelligenceSettings(): chatIntelligenceSettingsRecord[] {
    return getDefaultChatIntelligences()
}

export function getDefaultChatIntelligences(): chatIntelligenceSettingsRecord[] {
    const defaultIntelligencesFromStorage = _getDefaultChatIntelligencesFromLocalStorage()
    const inStorageIntelligencesNumber = defaultIntelligencesFromStorage.length
    // append the intelligences in defaultIntelligences that are not in defaultIntelligencesFromStorage
    for (const intelligenceId of Object.keys(defaultIntelligenceSettings)) {
        if (!defaultIntelligencesFromStorage.some((s) => s.id === intelligenceId)) {
            defaultIntelligencesFromStorage.push({ id: intelligenceId, ...defaultIntelligenceSettings[intelligenceId] })
        }
    }
    if (defaultIntelligencesFromStorage.length !== inStorageIntelligencesNumber) {
        _saveDefaultChatIntelligencesToLocalStorage(defaultIntelligencesFromStorage)
    }
    return defaultIntelligencesFromStorage
}

export class ChatIntelligenceRegistry {
    private intelligenceMap: Map<string, (serialized: string) => ChatIntelligenceBase> = new Map();

    registerChatIntelligenceSerializer(type: string, deserializer: (serialized: string) => ChatIntelligenceBase) {
        if (this.intelligenceMap.has(type)) {
            throw new Error(`Chat intelligence with type ${type} already registered`)
        }
        this.intelligenceMap.set(type, deserializer);
    }

    getChatIntelligenceSerializer(type: string): ((serialized: string) => ChatIntelligenceBase) | undefined {
        return this.intelligenceMap.get(type);
    }
}

export const intelligenceRegistry = new ChatIntelligenceRegistry();

export interface ChatIntelligence {
    completeChat(messageList: Message[]): Message[];
}

export abstract class ChatIntelligenceBase implements ChatIntelligence {
    type: string;
    name: i18nText;

    constructor(type: string, name: i18nText) {
        this.type = type;
        this.name = name;
    }

    abstract completeChat(messageList: Message[]): Message[];

    abstract serialize(): string;

    static deserialize(serialized: string): ChatIntelligenceBase {
        const { type } = JSON.parse(serialized);
        const deserializer = intelligenceRegistry.getChatIntelligenceSerializer(type);
        if (deserializer) {
            return deserializer(serialized);
        } else {
            throw new Error(`Deserialization method for type ${type} is not implemented`);
        }
    }
}

export class FreeTrialChatIntelligence extends ChatIntelligenceBase {
    static readonly id = 'free_trial'
    static readonly type = 'free_trial'
    static readonly _name: i18nText = { key: 'Free Trial' }

    completeChat(messageList: Message[]): Message[] {
        async function* genFunc() {
            const { status } = await freeTrialChatCompletionInStream(
                messageList
                    .filter((msg) => msg.includedInChatCompletion)
                    .filter((msg) => isOpenAILikeMessage(msg))
                    .map((msg) => (msg.toOpenAIMessage()))
            )

            for await (const value of readStreamableValue(status)) {
                yield value ?? '' // no idea what it represents when the value is undefined, so just replace it with ''
            }
            return
        }
        const gen = genFunc()
        return [new StreamingTextMessage(SpecialRoles.ASSISTANT, gen)]
    }

    serialize(): string {
        return JSON.stringify({ type: this.type })
    }

    static deserialize(): FreeTrialChatIntelligence {
        return new FreeTrialChatIntelligence()
    }

    constructor() {
        super(FreeTrialChatIntelligence.type, FreeTrialChatIntelligence._name)
    }
}


// BabelDuck intelligence (just for fun :D)
class BabelDuckChatIntelligence extends ChatIntelligenceBase {
    static readonly id = 'babel_duck'
    static readonly type = 'babel_duck'

    constructor() {
        super(BabelDuckChatIntelligence.type, { text: 'Babel Duck' })
    }

    completeChat(): Message[] {
        const quackCount = Math.floor(Math.random() * 10)
        const quacks: string = Array(quackCount).fill('quack').join(' ')
        return [new TextMessage(SpecialRoles.ASSISTANT, quacks)]
    }

    serialize(): string {
        return JSON.stringify({ type: this.type })
    }

    static deserialize(): BabelDuckChatIntelligence {
        return new BabelDuckChatIntelligence()
    }
}

intelligenceRegistry.registerChatIntelligenceSerializer('babel_duck', BabelDuckChatIntelligence.deserialize);
intelligenceRegistry.registerChatIntelligenceSerializer('free_trial', FreeTrialChatIntelligence.deserialize);


export const defaultIntelligenceSettings: Record<string, chatIntelligenceSettings> = {
    [FreeTrialChatIntelligence.id]: { name: { key: 'Free Trial' }, type: FreeTrialChatIntelligence.type, settings: {} },
    [BabelDuckChatIntelligence.id]: { name: { key: 'Babel Duck' }, type: BabelDuckChatIntelligence.type, settings: {} }
}