'use client'

import { LuSettings } from "react-icons/lu";
import { useEffect, useState } from 'react';
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import i18n, { I18nText } from '../../i18n/i18n';
import { DropdownMenu, DropdownMenuEntry } from "@/app/ui-utils/components/DropdownMenu";
import { TransparentOverlay } from "@/app/ui-utils/components/overlay";
import { getDefaultLLMServices, LLMServiceRecord, updateLLMServiceSettings } from "@/app/intelligence-llm/lib/llm-service";
import { getLLMSettingsComponent } from "@/app/intelligence-llm/components/llm-service";
import { ChatSettings, loadGlobalChatSettings, setGlobalChatSettings } from "@/app/chat/lib/chat";
import { getAvailableChatIntelligenceSettings } from "@/app/intelligence-llm/lib/intelligence";

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
    return _ChatSettings({ chatSettingsPayload: chatSettings, updateChatSettings: setGlobalChatSettings })
}

function _ChatSettings({ chatSettingsPayload, updateChatSettings, className = "" }:
    { chatSettingsPayload: ChatSettings, updateChatSettings: (payload: ChatSettings) => void, className?: string }) {

    const { t } = useTranslation();
    const [showIntelligenceDropdown, setShowIntelligenceDropdown] = useState(false);
    const toggleIntelligenceDropdown = () => setShowIntelligenceDropdown(!showIntelligenceDropdown);

    const availableIntelligences = getAvailableChatIntelligenceSettings()
    const intelligenceDropdownItems = availableIntelligences.map((intelligence) => ({
        label: <I18nText i18nText={intelligence.name} />,
        onClick: () => {
            updateChatSettings({ ...chatSettingsPayload, chatIntelligence: intelligence })
            toggleIntelligenceDropdown()
        }
    }))

    return <div className={`flex flex-col ${className}`}>
        {/* intelligence settings */}
        <div className="flex flex-row items-center justify-between relative mb-4">
            <span className="text-gray-700 font-bold">{t('Chat Model')}</span>
            <DropdownMenuEntry
                label={<I18nText i18nText={chatSettingsPayload.chatIntelligence.name} />}
                onClick={toggleIntelligenceDropdown}
            />
            {showIntelligenceDropdown && <>
                <DropdownMenu className="absolute right-0 top-full" menuItems={intelligenceDropdownItems} />
                <TransparentOverlay onClick={toggleIntelligenceDropdown} />
            </>}
        </div>
        {/* input handlers settings */}

    </div>
}

function LLMSettings() {
    const { t } = useTranslation();
    const [compState, setCompState] = useState<{
        llmServices: LLMServiceRecord[],
        selectedSvcId: string | null,
    }>({ llmServices: [], selectedSvcId: null })

    const selectedSvc = compState.llmServices.find((svc) => svc.id === compState.selectedSvcId)
    const SettingsComponent = selectedSvc?.type ? getLLMSettingsComponent(selectedSvc.type) : null;

    const [showDropdown, setShowDropdown] = useState(false)
    const toggleDropdown = () => setShowDropdown(!showDropdown)

    useEffect(() => {
        const defaultSvcs = getDefaultLLMServices()
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