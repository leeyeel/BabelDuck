'use client'
import { SpecialRoles, StreamingTextMessage, TextMessage } from "@/app/chat/components/message";
import { isOpenAILikeMessage } from "@/app/chat/lib/message";
import { Message } from "@/app/chat/lib/message";
import { DropdownMenu, DropdownMenuEntry } from "@/app/ui-utils/components/DropdownMenu";
import { readStreamableValue } from "ai/rsc";
import { useState } from "react";
import { freeTrialChatCompletionInStream } from "./llm-service-server";

export interface ChatIntelligence {
    completeChat(messageList: Message[]): Message[]
    settingsPanel(): () => JSX.Element
}

// Define IntelligenceHub class
class IntelligenceHub {
    private intelligenceMap: Map<string, (serialized: string) => ChatIntelligenceBase> = new Map();

    registerIntelligence(type: string, deserialize: (serialized: string) => ChatIntelligenceBase) {
        this.intelligenceMap.set(type, deserialize);
    }

    getIntelligenceClassByType(type: string): ((serialized: string) => ChatIntelligenceBase) | undefined {
        return this.intelligenceMap.get(type);
    }
}

// Create a global instance of IntelligenceHub
export const intelligenceHub = new IntelligenceHub();

export abstract class ChatIntelligenceBase implements ChatIntelligence {
    type: string
    constructor(type: string) {
        this.type = type
    }

    abstract completeChat(messageList: Message[]): Message[]

    abstract settingsPanel(): () => JSX.Element

    abstract serialize(): string

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static deserialize(serialized: string): ChatIntelligenceBase {
        return new FreeTrialIntelligence()
        // const { type } = JSON.parse(serialized);
        // const deserialize = intelligenceHub.getIntelligenceClassByType(type);
        // if (deserialize) {
        //     return deserialize(serialized);
        // } else {
        //     throw new Error(`Deserialization method for type ${type} is not implemented`);
        // }
    }
}

// intelligence for free trial
export class FreeTrialIntelligence extends ChatIntelligenceBase {

    settingsPanel(): () => JSX.Element {
        const Root = () => {
            const [mode, setMode] = useState<'base' | 'ultimate'>('base')
            const [showModeMenu, setShowModeMenu] = useState(false)
            const menuItems = ['base', 'ultimate'].map((item) => ({ label: item, onClick: () => setMode(item as 'base' | 'ultimate') }))
            return <>
                <DropdownMenuEntry label={mode}
                    onClick={() => {
                        if (showModeMenu) setShowModeMenu(false)
                        else setShowModeMenu(true)
                    }} />
                {showModeMenu && <DropdownMenu menuItems={menuItems} />}
            </>
        }
        return Root
    }

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

    constructor() {
        super('free_trial')
    }
}

// intelligence for tutorial


// BabelDuck intelligence (just for fun :D)
// basic mode always respond random number of "quack" to the user
// if ultimate mode is on, respond "42" to the user
export class BabelDuckIntelligence extends ChatIntelligenceBase {

    mode: 'base' | 'ultimate'
    constructor(mode: 'base' | 'ultimate') {
        super('babel_duck')
        this.mode = mode
    }

    completeChat(): Message[] {
        if (this.mode === 'base') {
            const quackCount = Math.floor(Math.random() * 10)
            const quacks: string = Array(quackCount).fill('quack').join(' ')
            return [new TextMessage(SpecialRoles.ASSISTANT, quacks)]
        } else {
            return [new TextMessage(SpecialRoles.ASSISTANT, '42')]
        }
    }
    settingsPanel(): () => JSX.Element {
        const Root = () => {
            const [mode, setMode] = useState<'base' | 'ultimate'>('base')
            const [showModeMenu, setShowModeMenu] = useState(false)
            const menuItems = ['base', 'ultimate'].map((item) => ({ label: item, onClick: () => setMode(item as 'base' | 'ultimate') }))
            return <>
                <DropdownMenuEntry label={mode}
                    onClick={() => {
                        if (showModeMenu) setShowModeMenu(false)
                        else setShowModeMenu(true)
                    }} />
                {showModeMenu && <DropdownMenu menuItems={menuItems} />}
            </>
        }
        return Root
    }

    serialize(): string {
        return JSON.stringify({ type: this.type, mode: this.mode })
    }

    static deserialize(serialized: string): ChatIntelligenceBase {
        const { mode } = JSON.parse(serialized);
        return new BabelDuckIntelligence(mode)
    }
}

// Register all ChatIntelligenceBase subclasses
intelligenceHub.registerIntelligence('babel_duck', BabelDuckIntelligence.deserialize);

