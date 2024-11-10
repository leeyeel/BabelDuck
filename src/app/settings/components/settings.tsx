'use client'

import { LuSettings } from "react-icons/lu";
import { useEffect, useState } from 'react';
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import i18n, { i18nText, I18nText } from '../../i18n/i18n';
import { DropdownMenu, DropdownMenuEntry } from "@/app/ui-utils/components/DropdownMenu";
import { TransparentOverlay } from "@/app/ui-utils/components/overlay";
import { getBuiltInLLMServicesSettings, getLLMServiceSettingsRecord, LLMServiceSettingsRecord, OpenAIService, updateLLMServiceSettings } from "@/app/intelligence-llm/lib/llm-service";
import { getLLMSettingsComponent, OpenAIServiceSettings } from "@/app/intelligence-llm/components/llm-service";
import { ChatSettings, GlobalDefaultChatSettingID, loadGlobalChatSettings, setGlobalChatSettings } from "@/app/chat/lib/chat";
import { getAvailableChatIntelligenceSettings, getChatIntelligenceSettingsByID, OpenAIChatIntelligence } from "@/app/intelligence-llm/lib/intelligence";
import { InputHandler } from "@/app/chat/components/input-handlers";
import { OpenAIChatISettings } from "@/app/intelligence-llm/components/intelligence";

// settings entry in the sidebar
export function SettingsEntry({ className = "" }: { className?: string }) {
    const [showSettings, setShowSettings] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <div
                className={`flex flex-row py-2 pl-3 items-center cursor-pointer rounded-md hover:bg-gray-200 ${className}`}
                onClick={() => setShowSettings(true)}
            >
                <LuSettings className="mr-3" />
                <span>{t('Settings')}</span>
            </div>
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </>
    );
}

export function Settings({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState('General');

    const firstLevelMenuEntries = [
        { key: 'General', name: t('General') },
        { key: 'Chat', name: t('Chat') },
        { key: 'Speech', name: t('Speech') },
        { key: 'Models', name: t('Models') },
    ];

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Semi-transparent mask */}
            <div
                className="absolute inset-0 bg-black opacity-50"
                onClick={onClose}
            ></div>
            {/* Settings content */}
            <div className="bg-white rounded-2xl z-10 w-11/12 md:w-3/4 lg:w-1/2 max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4">
                    <h2 className="text-xl font-semibold">{t('Settings')}</h2>
                    <IoMdClose
                        className="text-2xl cursor-pointer"
                        onClick={onClose}
                    />
                </div>
                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="flex flex-row h-full">
                        <div className="w-1/4">
                            {firstLevelMenuEntries.map((item) => (
                                <FirstLevelMenuEntry
                                    className="my-2"
                                    key={item.key}
                                    menuKey={item.key}
                                    menuName={item.name}
                                    selected={selectedItem === item.key}
                                    onSelect={setSelectedItem}
                                />
                            ))}
                        </div>
                        <div className="w-3/4 p-4">
                            {selectedItem === 'General' && <GeneralSettings />}
                            {selectedItem === 'Chat' && <GlobalChatSettings />}
                            {selectedItem === 'Models' && <LLMSettings />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// first level menu entry in the settings pannel
function FirstLevelMenuEntry({
    menuKey,
    menuName,
    selected,
    onSelect,
    className = "",
}: {
    menuKey: string;
    menuName: string;
    selected: boolean;
    onSelect: (item: string) => void;
    className?: string;
}) {
    return (
        <div
            className={`py-2 px-4 cursor-pointer rounded-lg hover:bg-gray-100 ${selected ? 'bg-gray-200 font-semibold' : ''
                } ${className}`}
            onClick={() => onSelect(menuKey)}
        >
            {menuName}
        </div>
    );
}


// ============================= Sub Category Settings Components =============================


function GeneralSettings() {
    const { t } = useTranslation();

    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
    const [showDropdown, setShowDropdown] = useState(false);
    const langNameMapping = {
        en: 'English',
        zh: '中文',
        ja: '日本語',
    }
    const langName = langNameMapping[selectedLanguage as keyof typeof langNameMapping];

    const handleLanguageChange = (newLanguage: string) => {
        setSelectedLanguage(newLanguage);
        i18n.changeLanguage(newLanguage);
        localStorage.setItem('selectedLanguage', newLanguage);
        setShowDropdown(false);
    };

    return (
        <div className="flex flex-col pl-8">
            {/* language settings */}
            <div className="flex flex-row items-center justify-between">
                <span className="text-gray-700 font-bold">{t('Select Your Language')}</span>
                <div className="flex flex-col relative">
                    <DropdownMenuEntry label={langName} onClick={() => setShowDropdown(true)} className="" />
                    {showDropdown &&
                        <>
                            <DropdownMenu
                                className="absolute right-0 top-full"
                                menuItems={[
                                    { label: 'English', onClick: () => handleLanguageChange('en') },
                                    { label: '中文', onClick: () => handleLanguageChange('zh') },
                                    { label: '日本語', onClick: () => handleLanguageChange('ja') },
                                ]} />
                            <TransparentOverlay onClick={() => setShowDropdown(false)} />
                        </>
                    }
                </div>
            </div>
        </div>
    );
}

function GlobalChatSettings() {
    const chatSettings = loadGlobalChatSettings()
    return <CommonChatSettings chatSettings={chatSettings} updateChatSettings={setGlobalChatSettings} />
}

// TODO documentation for naming abbreviations
// RO = Rendering Object
// chatI = chatIntelligence

type ChatSettingsRO = {
    chatISettings: {
        id: string
        name: i18nText,
        chatIType: string
        settings: object
    }
    availableChatIs: { id: string, name: i18nText }[]
    inputHandlers: InputHandler[]
}

function assembleChatSettingsRO(chatSettings: ChatSettings): ChatSettingsRO {
    const availableChatIs = getAvailableChatIntelligenceSettings()
    const chatIID = chatSettings.ChatISettings.id
    const rawChatISettings = chatSettings.ChatISettings.settings
    const currentChatISettingsRecord = getChatIntelligenceSettingsByID(chatIID)

    // let chatISettingsRO: object = {}
    // if (currentChatISettingsRecord.type === OpenAIService.type) {
    //     const _openAISettings = rawChatISettings as OpenAIChatIntelligenceSettings
    //     if (_openAISettings.settingsType === 'local') {
    //         chatISettingsRO = _openAISettings.localSettings!
    //     } else {
    //         const llmServiceSettings = getLLMServiceSettingsRecord('openai')
    //         if (!llmServiceSettings) {
    //             throw new Error(`LLM service settings not found: ${_openAISettings.settingsType}`)
    //         }
    //         chatISettingsRO = llmServiceSettings.settings
    //     }
    // }

    return {
        chatISettings: {
            id: currentChatISettingsRecord.id,
            name: currentChatISettingsRecord.name,
            chatIType: currentChatISettingsRecord.type,
            settings: rawChatISettings,
        },
        availableChatIs: availableChatIs,
        inputHandlers: chatSettings.inputHandlers
    }
}

function CommonChatSettings({ chatSettings, updateChatSettings, className = "" }:
    { chatSettings: ChatSettings, updateChatSettings: (payload: ChatSettings) => void, className?: string }) {

    const { t } = useTranslation();

    const [selectedChatISettings, setSelectedChatISettings] = useState(chatSettings)
    const chatSettingsRO = assembleChatSettingsRO(selectedChatISettings)

    const [showIntelligenceDropdown, setShowIntelligenceDropdown] = useState(false);
    const toggleIntelligenceDropdown = () => setShowIntelligenceDropdown(!showIntelligenceDropdown);

    function switchChatI(chatIID: string) {
        const chatISettingsRecord = getChatIntelligenceSettingsByID(chatIID)
        updateChatSettings({
            ChatISettings: {
                id: chatIID,
                settings: chatISettingsRecord.settings,
            },
            inputHandlers: chatSettingsRO.inputHandlers,
        })
        setSelectedChatISettings({
            ChatISettings: {
                id: chatIID,
                settings: chatISettingsRecord.settings,
            },
            inputHandlers: chatSettings.inputHandlers,
        })
    }
    function updateSelectedChatISettings(newChatIsettings: object) {
        updateChatSettings({
            ChatISettings: {
                id: selectedChatISettings.ChatISettings.id,
                settings: newChatIsettings,
            },
            inputHandlers: selectedChatISettings.inputHandlers,
        })
        setSelectedChatISettings({
            ChatISettings: {
                id: selectedChatISettings.ChatISettings.id,
                settings: newChatIsettings,
            },
            inputHandlers: selectedChatISettings.inputHandlers,
        })
    }

    const intelligenceDropdownItems = chatSettingsRO.availableChatIs.map((intelligence) => ({
        label: <I18nText i18nText={intelligence.name} />,
        onClick: () => {
            switchChatI(intelligence.id)
            toggleIntelligenceDropdown()
        }
    }))

    return <div className={`flex flex-col ${className}`}>
        {/* intelligence settings */}
        <div className="flex flex-row items-center justify-between relative mb-4">
            <span className="text-gray-700 font-bold">{t('Chat Model')}</span>
            <DropdownMenuEntry
                label={<I18nText i18nText={chatSettingsRO.chatISettings.name} />}
                onClick={toggleIntelligenceDropdown}
            />
            {showIntelligenceDropdown && <>
                <DropdownMenu className="absolute right-0 top-full" menuItems={intelligenceDropdownItems} />
                <TransparentOverlay onClick={toggleIntelligenceDropdown} />
            </>}
        </div>
        {chatSettingsRO.chatISettings.chatIType === OpenAIChatIntelligence.type &&
            <OpenAIChatISettings settings={chatSettingsRO.chatISettings.settings}
                updateChatISettings={updateSelectedChatISettings} />}
        {/* input handlers settings */}

    </div>
}

function LLMSettings() {
    const { t } = useTranslation();
    const [compState, setCompState] = useState<{
        llmServices: LLMServiceSettingsRecord[],
        selectedSvcId: string | null,
    }>({ llmServices: [], selectedSvcId: null })

    const selectedSvc = compState.llmServices.find((svc) => svc.id === compState.selectedSvcId)
    const SettingsComponent = selectedSvc?.type ? getLLMSettingsComponent(selectedSvc.type) : null;

    const [showDropdown, setShowDropdown] = useState(false)
    const toggleDropdown = () => setShowDropdown(!showDropdown)

    useEffect(() => {
        const defaultSvcs = getBuiltInLLMServicesSettings()
        setCompState({ llmServices: defaultSvcs, selectedSvcId: defaultSvcs.length > 0 ? defaultSvcs[0].id : null })
    }, [])

    const updateSettings = (serviceId: string, settings: object) => {
        updateLLMServiceSettings(serviceId, settings)
    }

    return <div className="flex flex-col pl-8">
        <div className="flex flex-row items-center justify-between relative mb-4">
            <span className="text-gray-700 font-bold">{t('Models Service')}</span>
            <DropdownMenuEntry label={selectedSvc ? <I18nText i18nText={selectedSvc.name} /> : 'No LLM Service'}
                onClick={toggleDropdown} />
            {showDropdown && <>
                <DropdownMenu menuItems={
                    compState.llmServices.map((service) => ({
                        label: <I18nText i18nText={service.name} />,
                        onClick: () => { setCompState({ ...compState, selectedSvcId: service.id }); toggleDropdown() }
                    }))
                } className="absolute right-0 top-full" />
                <TransparentOverlay onClick={toggleDropdown} />
            </>}
        </div>
        {selectedSvc?.type && SettingsComponent && <SettingsComponent settings={selectedSvc.settings}
            updateSettings={(settings) => { updateSettings(selectedSvc.id, settings) }} />}
    </div>
}