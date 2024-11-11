'use client'

import { useTranslation } from "react-i18next";
import { OpenAIService, OpenAISettings, SiliconFlowService } from "../lib/llm-service";
import { DropdownMenu, DropdownMenuEntry } from "@/app/ui-utils/components/DropdownMenu";
import { useState } from "react";
import { TransparentOverlay } from "@/app/ui-utils/components/overlay";
import { FilledButton } from "@/app/ui-utils/components/button";


export interface LLMSettingsProps<T> {
    settings: T;
    updateSettings: (settings: T) => void;
}
export type LLMSettingsComponent<T> = (props: LLMSettingsProps<T>) => React.ReactNode;

const settingsRegistry: Record<string, LLMSettingsComponent<object>> = {};
export function getLLMSettingsComponent(type: string): LLMSettingsComponent<object> {
    const component = settingsRegistry[type];
    if (!component) {
        throw new Error(`Settings component for ${type} not found`);
    }
    return component;
}
export function registerLLMSettingsComponent(
    type: string,
    component: LLMSettingsComponent<object>
) {
    if (settingsRegistry[type]) {
        throw new Error(`Settings component for ${type} already registered`);
    }
    settingsRegistry[type] = component;
}

// ============================= LLM Service Settings Components =============================

export function OpenAIServiceSettings({ settings: unTypedSettings, updateSettings }: LLMSettingsProps<object>) {
    const settings = unTypedSettings as OpenAISettings;
    const { t } = useTranslation();

    const [baseURL, setBaseURL] = useState(settings.baseURL);
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [chatCompletionModel, setChatCompletionModel] = useState(settings.chatCompletionModel);

    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const toggleModelDropdown = () => setShowModelDropdown(!showModelDropdown);

    const [lastTimeSavedSettings, setLastTimeSavedSettings] = useState(settings);
    const settingsChanged: boolean = lastTimeSavedSettings.baseURL !== baseURL
        || lastTimeSavedSettings.apiKey !== apiKey
        || lastTimeSavedSettings.chatCompletionModel !== chatCompletionModel;

    return <div className="flex flex-col">
        {/* model */}
        <div className="flex flex-col mb-8">
            <span className="text-gray-700 font-bold mb-2">{t('Model-Single-Form')}</span>
            <div className="relative">
                <DropdownMenuEntry className="w-fit bg-gray-100" label={chatCompletionModel} onClick={toggleModelDropdown} />
                {showModelDropdown && <> <DropdownMenu className="absolute left-0 top-full"
                    menuItems={OpenAIService.availableChatModels.map(
                        model => ({ label: model, onClick: () => { setChatCompletionModel(model); toggleModelDropdown() } })
                    )}
                />
                    <TransparentOverlay onClick={toggleModelDropdown} />
                </>}
            </div>
        </div>
        {/* base url */}
        <div className="mb-8 flex flex-col">
            <span className="text-gray-700 font-bold mb-2">{t('baseURL')}</span>
            <input type="text" id="base-url" placeholder="https://api.openai.com"
                className="border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={baseURL} onChange={e => setBaseURL(e.target.value)} />
        </div>
        {/* api key */}
        <div className="mb-8 flex flex-col">
            <span className="text-gray-700 font-bold mb-2">{t('API Key')}</span>
            <input type="text" id="api-key" placeholder="sk-..."
                className="border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </div>
        {/* save button */}
        {settingsChanged && <FilledButton
            className="w-fit self-end"
            onClick={() => {
                setLastTimeSavedSettings({ baseURL, apiKey, chatCompletionModel });
                updateSettings({ baseURL, apiKey, chatCompletionModel })
            }}>
            {t('Save')}
        </FilledButton>}
    </div>
}

export function SiliconFlowServiceSettings({ settings: unTypedSettings, updateSettings }: LLMSettingsProps<object>) {
    const settings = unTypedSettings as OpenAISettings;
    const { t } = useTranslation();

    const [baseURL, setBaseURL] = useState(settings.baseURL);
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [chatCompletionModel, setChatCompletionModel] = useState(settings.chatCompletionModel);

    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const toggleModelDropdown = () => setShowModelDropdown(!showModelDropdown);

    const [lastTimeSavedSettings, setLastTimeSavedSettings] = useState(settings);
    const settingsChanged: boolean = lastTimeSavedSettings.baseURL !== baseURL
        || lastTimeSavedSettings.apiKey !== apiKey
        || lastTimeSavedSettings.chatCompletionModel !== chatCompletionModel;

    return <div className="flex flex-col">
        {/* model */}
        <div className="flex flex-col mb-8">
            <span className="text-gray-700 font-bold mb-2">{t('Model-Single-Form')}</span>
            <div className="relative">
                <DropdownMenuEntry className="w-fit bg-gray-100" label={chatCompletionModel} onClick={toggleModelDropdown} />
                {showModelDropdown && <> <DropdownMenu className="absolute left-0 top-full"
                    menuItems={SiliconFlowService.availableChatModels.map(
                        model => ({ label: model, onClick: () => { setChatCompletionModel(model); toggleModelDropdown() } })
                    )}
                />
                    <TransparentOverlay onClick={toggleModelDropdown} />
                </>}
            </div>
        </div>
        {/* base url */}
        <div className="mb-8 flex flex-col">
            <span className="text-gray-700 font-bold mb-2">{t('baseURL')}</span>
            <input type="text" id="base-url" placeholder={SiliconFlowService.defaultHost}
                className="border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={baseURL} onChange={e => setBaseURL(e.target.value)} />
        </div>
        {/* api key */}
        <div className="mb-8 flex flex-col">
            <span className="text-gray-700 font-bold mb-2">{t('API Key')}</span>
            <input type="text" id="api-key" placeholder="sk-..."
                className="border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </div>
        {/* save button */}
        {settingsChanged && <FilledButton
            className="w-fit self-end"
            onClick={() => {
                setLastTimeSavedSettings({ baseURL, apiKey, chatCompletionModel });
                updateSettings({ baseURL, apiKey, chatCompletionModel })
            }}>
            {t('Save')}
        </FilledButton>}
    </div>
}

registerLLMSettingsComponent(OpenAIService.type, OpenAIServiceSettings);
registerLLMSettingsComponent(SiliconFlowService.type, SiliconFlowServiceSettings);
