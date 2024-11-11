'use client'

import { TransparentButton } from "@/app/ui-utils/components/button"
import type { OpenAIChatISettings } from "../lib/intelligence"
import { getLLMServiceSettingsRecord } from "../lib/llm-service"
import { OpenAIServiceSettings } from "./llm-service"
import { useState } from "react"

export function OpenAIChatISettings(
    { settings: untypedSettings, updateChatISettings }: { settings: object, updateChatISettings: (settings: object) => void }
) {
    const settings = untypedSettings as OpenAIChatISettings
    const [openaiSvcSettingsKey, setOpenaiSvcSettingsKey] = useState(0)

    let openaiSvcSettings = {}
    if (settings.settingsType === 'local') {
        openaiSvcSettings = settings.localSettings!
    } else {
        const llmServiceSettings = getLLMServiceSettingsRecord('openai')
        if (!llmServiceSettings) {
            throw new Error(`LLM service settings not found: ${settings.settingsType}`)
        }
        openaiSvcSettings = llmServiceSettings.settings
    }

    const isLocal = settings.settingsType === 'local'

    function resetToLinkTypeSettings() {
        updateChatISettings({
            'settingsType': 'link'
        })
        setOpenaiSvcSettingsKey(openaiSvcSettingsKey + 1)
    }

    return <div className="flex flex-col relative">
        <OpenAIServiceSettings key={openaiSvcSettingsKey} settings={openaiSvcSettings}
            updateSettings={(openaiSettings) => {
                updateChatISettings({
                    'settingsType': 'local',
                    'localSettings': openaiSettings
                })
            }} />
        {isLocal &&
            <TransparentButton className="absolute right-0 top-0" onClick={() => { resetToLinkTypeSettings() }}> Reset to Default </TransparentButton>
        }
    </div>
}
