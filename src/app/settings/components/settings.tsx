'use client'

import { LuSettings } from "react-icons/lu";
import { useEffect, useState, useMemo } from 'react';
import { IoMdClose, IoMdInformationCircleOutline } from "react-icons/io";
import { useTranslation } from "react-i18next";
import i18n, { i18nText, I18nText } from '../../i18n/i18n';
import { DropDownMenuV2 } from "@/app/ui-utils/components/DropdownMenu";
import { addCustomLLMServiceSettings, getLLMServiceSettings, LLMServiceSettingsRecord, OpenAICompatibleAPIService, updateLLMServiceSettings } from "@/app/intelligence-llm/lib/llm-service";
import { getLLMSettingsComponent } from "@/app/intelligence-llm/components/llm-service";
import { ChatSettings, loadChatSettings, loadGlobalChatSettings, LocalChatSettings, setGlobalChatSettings, setLocalChatSettings, switchToGlobalChatSettings, switchToLocalChatSettings } from "@/app/chat/lib/chat";
import { BabelDuckChatIntelligence, CustomLLMChatIntelligence, FreeTrialChatIntelligence, getSelectableChatIntelligenceSettings, getChatIntelligenceSettingsByID, OpenAIChatIntelligence } from "@/app/intelligence-llm/lib/intelligence";
import { InputHandler } from "@/app/chat/components/input-handlers";
import { BabelDuckChatISettings, CustomLLMChatISettings, FreeTrialChatISettings, OpenAIChatISettings } from "@/app/intelligence-llm/components/intelligence";
import Switch from "react-switch";
import { IconCircleWrapper } from "@/app/chat/components/message";
import { PiTrashBold } from "react-icons/pi";
import { Tooltip } from "react-tooltip";
import { TbCloud, TbCloudPlus } from "react-icons/tb";
import { IoStopCircleOutline } from "react-icons/io5";
import { PiSpeakerHighBold } from "react-icons/pi";
import { WebSpeechTTS } from "@/app/chat/lib/tts-service";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setCurrentChatSettings } from "@/app/chat/components/chat";

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
    const [selectedItem, setSelectedItem] = useState('Chat');

    const firstLevelMenuEntries = [
        { key: 'Chat', name: t('Chat') },
        { key: 'Speech', name: t('Speech') },
        { key: 'Models', name: t('Models') },
        { key: 'General', name: t('General') }, // Currently there are few options to set, so it's placed at the end, though it should normally be at the front
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
                            {selectedItem === 'Chat' && <GlobalChatSettings />}
                            {selectedItem === 'Speech' && <SpeechSettings />}
                            {selectedItem === 'Models' && <LLMSettings />}
                            {selectedItem === 'General' && <GeneralSettings />}
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
    };

    return (
        <div className="flex flex-col pl-8">
            {/* language settings */}
            <div className="flex flex-row items-center justify-between">
                <span className="text-gray-700 font-bold">{t('Select Your Language')}</span>
                <DropDownMenuV2
                    entryLabel={langName}
                    menuItems={[
                        { label: 'English', onClick: () => handleLanguageChange('en') },
                        { label: '中文', onClick: () => handleLanguageChange('zh') },
                        { label: '日本語', onClick: () => handleLanguageChange('ja') },
                    ]}
                    menuClassName="right-0"
                />
            </div>
        </div>
    );
}

function GlobalChatSettings() {

    const dispatch = useAppDispatch()
    const [chatSettings, setChatSettings] = useState(loadGlobalChatSettings())
    const { currentChatID, currentChatSettings } = useAppSelector((state) => state.currentChatSettings)

    return <CommonChatSettings chatSettings={chatSettings} updateChatSettings={(newChatSettings) => {
        setChatSettings(newChatSettings)
        setGlobalChatSettings(newChatSettings)
        if (currentChatID !== undefined && currentChatSettings !== undefined) {
            const localChatSettings = loadChatSettings(currentChatID)
            // only when the current chat is using global settings, then update redux states
            if (localChatSettings.usingGlobalSettings) {
                dispatch(setCurrentChatSettings({
                    chatID: currentChatID,
                    chatSettings: {
                        ...newChatSettings,
                        usingGlobalSettings: true,
                        inputHandlers: newChatSettings.inputHandlers.map((handler) => ({
                            handler: handler.handler.serialize(),
                            display: handler.display
                        }))
                    }
                }))
            }
        }
    }} />
}

export function LocalChatSettingsComponent({ chatID, chatSettings }: {
    chatID: string,
    chatSettings: LocalChatSettings,
}) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch()

    // if no local chat settings have been set up for this chat before, then create one
    // otherwise, switch back to the existing local chat settings
    function createOrSwitchBackToLocalChatSettings() {
        switchToLocalChatSettings(chatID)
        const localChatSettings = loadChatSettings(chatID)
        dispatch(setCurrentChatSettings({
            chatID: chatID,
            chatSettings: {
                ...localChatSettings,
                usingGlobalSettings: false,
                inputHandlers: localChatSettings.inputHandlers.map((handler) => ({
                    handler: handler.handler.serialize(),
                    display: handler.display
                })),
            }
        }))
    }

    function _switchToGlobalChatSettings() {
        switchToGlobalChatSettings(chatID)
        const globalChatSettings = loadGlobalChatSettings()
        dispatch(setCurrentChatSettings({
            chatID: chatID,
            chatSettings: {
                usingGlobalSettings: true,
                ...globalChatSettings,
                inputHandlers: globalChatSettings.inputHandlers.map((handler) => ({
                    handler: handler.handler.serialize(),
                    display: handler.display
                })),
            }
        }))
    }

    function updateChatSettings(newChatSettings: ChatSettings) {
        if (chatSettings.usingGlobalSettings) {
            // if using global settings, then update the global settings
            setGlobalChatSettings(newChatSettings)
            dispatch(setCurrentChatSettings({
                chatID: chatID,
                chatSettings: {
                    ...newChatSettings,
                    usingGlobalSettings: true,
                    inputHandlers: newChatSettings.inputHandlers.map((handler) => ({
                        handler: handler.handler.serialize(),
                        display: handler.display
                    }))
                }
            }))
        } else {
            // if using local settings, then update the local settings
            setLocalChatSettings(chatID, newChatSettings)
            dispatch(setCurrentChatSettings({
                chatID: chatID,
                chatSettings: {
                    ...newChatSettings,
                    usingGlobalSettings: false,
                    inputHandlers: newChatSettings.inputHandlers.map((handler) => ({
                        handler: handler.handler.serialize(),
                        display: handler.display
                    })),
                }
            }))
        }
    }

    return <div className="flex flex-col">
        <div className="flex flex-col mb-8">
            {/* switch for setting whether to use global settings */}
            <div className="flex flex-row items-center justify-between mb-2">
                <span className="text-gray-700 font-bold">{t('useGlobalSettings')}</span>
                <Switch className={`mr-3`} width={28} height={17} uncheckedIcon={false} checkedIcon={false} onColor="#000000"
                    checked={chatSettings.usingGlobalSettings} onChange={(checked) => {
                        if (checked) {
                            _switchToGlobalChatSettings()
                        } else {
                            createOrSwitchBackToLocalChatSettings()
                        }
                    }} />
            </div>
            {/* description */}
            <div className="flex flex-row items-start">
                <IoMdInformationCircleOutline size={16} className="text-gray-400 mr-1 mt-1" />
                {chatSettings.usingGlobalSettings ?
                    <span className="text-gray-400 text-sm">{t('globalSettingsDescription.enabled')}</span> :
                    <span className="text-gray-400 text-sm">{t('globalSettingsDescription.disabled')}</span>
                }
            </div>
        </div>
        <CommonChatSettings chatSettings={chatSettings} updateChatSettings={updateChatSettings} />
    </div>
}

// TODO documentation for naming abbreviations
// RO = Rendering Object [this might be a bad design...]
// chatI = chatIntelligence

type ChatSettingsRO = {
    chatISettings: {
        id: string
        name: i18nText,
        chatIType: string
        settings: object
    }
    availableChatIs: { id: string, name: i18nText }[]
    inputHandlers: { handler: InputHandler, display: boolean }[]
}

function assembleChatSettingsRO(chatSettings: ChatSettings): ChatSettingsRO {
    const availableChatIs = getSelectableChatIntelligenceSettings()
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

    const chatSettingsRO = assembleChatSettingsRO(chatSettings)

    function switchChatI(chatIID: string) {
        const chatISettingsRecord = getChatIntelligenceSettingsByID(chatIID)
        updateChatSettings({
            ChatISettings: {
                id: chatIID,
                settings: chatISettingsRecord.settings,
            },
            inputHandlers: chatSettings.inputHandlers,
            autoPlayAudio: chatSettings.autoPlayAudio,
            inputComponent: chatSettings.inputComponent,
        })
    }
    function updateSelectedChatISettings(newChatIsettings: object) {
        updateChatSettings({
            ChatISettings: {
                id: chatSettings.ChatISettings.id,
                settings: newChatIsettings,
            },
            inputHandlers: chatSettings.inputHandlers,
            autoPlayAudio: chatSettings.autoPlayAudio,
            inputComponent: chatSettings.inputComponent,
        })
    }

    return <div className={`flex flex-col pl-8 ${className}`}>
        {/* chat intelligence settings */}
        <div className="flex flex-row items-center justify-between mb-8">
            <span className="text-gray-700 font-bold">{t('Chat Model')}</span>
            <DropDownMenuV2
                entryLabel={<I18nText i18nText={chatSettingsRO.chatISettings.name} />}
                menuItems={chatSettingsRO.availableChatIs.map((intelligence) => ({
                    label: <I18nText i18nText={intelligence.name} />,
                    onClick: () => switchChatI(intelligence.id)
                }))}
                menuClassName="right-0"
            />
        </div>
        {/* TODO tech-debt: dynamically load the settings component based on the chatIType */}
        {chatSettingsRO.chatISettings.chatIType === OpenAIChatIntelligence.type &&
            <div className="flex flex-col mb-4">
                <OpenAIChatISettings settings={chatSettingsRO.chatISettings.settings}
                    updateChatISettings={updateSelectedChatISettings} />
            </div>
        }
        {chatSettingsRO.chatISettings.chatIType === CustomLLMChatIntelligence.type &&
            <div className="flex flex-col mb-4">
                <CustomLLMChatISettings key={chatSettingsRO.chatISettings.id} settings={chatSettingsRO.chatISettings.settings}
                    updateChatISettings={updateSelectedChatISettings} />
            </div>
        }
        {chatSettingsRO.chatISettings.chatIType === FreeTrialChatIntelligence.type &&
            <div className="flex flex-col mb-4">
                <FreeTrialChatISettings settings={chatSettingsRO.chatISettings.settings}
                    updateChatISettings={updateSelectedChatISettings} />
            </div>
        }
        {chatSettingsRO.chatISettings.chatIType === BabelDuckChatIntelligence.type &&
            <div className="flex flex-col mb-4">
                <BabelDuckChatISettings settings={chatSettingsRO.chatISettings.settings}
                    updateChatISettings={updateSelectedChatISettings} />
            </div>
        }
        {/* input handlers settings */}
        <div className="flex flex-col mb-8">
            <span className="text-gray-700 font-bold mb-4">{t('Shortcut Instructions')}</span>
            {/* handlers */}
            {chatSettingsRO.inputHandlers.map((handler, index) => (
                <div key={index} className="flex flex-row justify-between">
                    {/* handler icon and tooltip */}
                    <div className="flex flex-row justify-start items-center mb-2">
                        <IconCircleWrapper
                            width={24} height={24} className="mr-2"
                            onClick={() => { }}
                        >
                            {handler.handler.iconNode}
                        </IconCircleWrapper>
                        <I18nText className="text-gray-500 text-sm" i18nText={handler.handler.tooltip()} />
                    </div>
                    {/* toggle display and delete button */}
                    <div className="flex flex-row items-center">
                        <div id={`toggle-instruction-${index}`}>
                            <Switch className={`mr-3`} width={28} height={17} uncheckedIcon={false} checkedIcon={false} onColor="#000000"
                                checked={handler.display} onChange={(checked) => { updateChatSettings({ ...chatSettings, inputHandlers: chatSettings.inputHandlers.map((h) => h.handler.implType === handler.handler.implType ? { ...h, display: checked } : h) }) }} />
                        </div>
                        <Tooltip
                            anchorSelect={`#toggle-instruction-${index}`}
                            delayShow={100} delayHide={0} place="top" style={{ borderRadius: '0.75rem' }}
                        > {t('toggleInstructionDisplay')}</Tooltip>
                        <div id={`delete-instruction-${index}`}>
                            <PiTrashBold
                                className={`${handler.handler.deletable ? 'cursor-pointer text-red-500' : 'cursor-not-allowed text-gray-400'}`}
                                onClick={() => {
                                    if (handler.handler.deletable) {
                                        updateChatSettings({
                                            ...chatSettings,
                                            inputHandlers: chatSettings.inputHandlers.filter((h) =>
                                                h.handler.implType !== handler.handler.implType
                                            )
                                        })
                                    }
                                }}
                            />
                        </div>
                        <Tooltip anchorSelect={`#delete-instruction-${index}`}
                            delayShow={100} delayHide={0} place="top" style={{ borderRadius: '0.75rem' }}>
                            {t(handler.handler.deletable ? 'deleteInstruction' : 'cannotDeleteBuiltInInstruction')}
                        </Tooltip>
                    </div>
                </div>
            ))}
        </div>
        {/* auto play audio settings */}
        <div className="flex flex-row items-center justify-between mb-8">
            <span className="text-gray-700 font-bold">{t('Auto Play Audio')}</span>
            <Switch checked={chatSettings.autoPlayAudio}
                width={28} height={17} uncheckedIcon={false} checkedIcon={false} onColor="#000000"
                onChange={(checked) => { updateChatSettings({ ...chatSettings, autoPlayAudio: checked }) }} />
        </div>
    </div>
}


// 修改 SpeechSettings 组件，添加状态管理
export function SpeechSettings({ className = "" }: { className?: string }) {
    const { t } = useTranslation();

    const availableSpeechSvcs = [
        { id: 'webSpeech', name: { key: 'speechSvc.webSpeech' } },
        { id: 'azure', name: { key: 'speechSvc.azure' } },
    ]

    const freeTrialSvcEnabled = !!(process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION)
    if (freeTrialSvcEnabled) {
        availableSpeechSvcs.unshift({ id: 'freeTrial', name: { key: 'speechSvc.freeTrial' } })
    }

    const [selectedSvcId, setSelectedSvcId] = useState(getSelectedSpeechSvcID());
    const [speechSettings, setSpeechSettings] = useState<object | null>(null);

    useEffect(() => {
        async function loadSettings() {
            const settings = await getSpeechSvcSettings(selectedSvcId);
            setSpeechSettings(settings);
        }
        loadSettings();
    }, [selectedSvcId]);

    function changeSpeechSvc(svcId: string) {
        setSelectedSvcId(svcId);
        localStorage.setItem('selectedSpeechServiceId', svcId);
    }

    const updateSpeechSettings = (svcId: string, newSettings: Partial<object>) => {
        const updatedSettings = { ...speechSettings, ...newSettings };
        localStorage.setItem(`speechSettings-${svcId}`, JSON.stringify(updatedSettings));
        setSpeechSettings(updatedSettings);
    };

    if (speechSettings === null) {
        return <div></div>;
    }

    return (
        <div className={className}>
            {/* service selector */}
            <div className="flex flex-row items-center justify-between mb-4">
                <span className="text-gray-700 font-bold">{t('Speech Synthesis Service')}</span>
                <DropDownMenuV2
                    entryLabel={<I18nText i18nText={availableSpeechSvcs.find((svc) => svc.id === selectedSvcId)?.name || availableSpeechSvcs[0].name} />}
                    menuItems={availableSpeechSvcs.map((svc) => ({
                        label: <I18nText i18nText={svc.name} />,
                        onClick: () => { changeSpeechSvc(svc.id) }
                    }))}
                    menuClassName="right-0"
                />
            </div>
            {/* settings */}
            {selectedSvcId === 'webSpeech' &&
                <WebSpeechSettingsPanel
                    unTypedSettings={speechSettings}
                    updateSettings={(newSettings) => { updateSpeechSettings(selectedSvcId, newSettings); }}
                />
            }
            {selectedSvcId === 'azure' &&
                <AzureTTSSettingsPanel
                    unTypedSettings={speechSettings}
                    updateSettings={(newSettings) => updateSpeechSettings(selectedSvcId, newSettings)}
                />
            }
            {selectedSvcId === 'freeTrial' &&
                <FreeTrialSettings />
            }
        </div>
    );
}

export function getSelectedSpeechSvcID() {
    const freeTrialSvcEnabled = !!(process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION)
    const defaultSvcId = freeTrialSvcEnabled ? 'freeTrial' : 'webSpeech'
    const selectedSvcId = localStorage.getItem('selectedSpeechServiceId') || defaultSvcId
    if (selectedSvcId === 'freeTrial' && !freeTrialSvcEnabled) {
        return defaultSvcId
    }
    return selectedSvcId
}

// load speech settings from local storage, and automatically correct invalid settings with default values
export async function getSpeechSvcSettings(svcId: string): Promise<object> {
    const saved = localStorage.getItem(`speechSettings-${svcId}`)
    const unTypedSettings = saved ? JSON.parse(saved) : {}
    switch (svcId) {
        case 'freeTrial':
            return {}
        case 'webSpeech':
            const webSpeechSettings = unTypedSettings as { lang?: string; voiceURI?: string }
            // validate lang
            let validLang = webSpeechSettings.lang || 'en'
            if (!speechSynthesisSystemLanguages[validLang]) {
                validLang = 'en'
            }
            // validate voiceURI
            const allVoices: SpeechSynthesisVoice[] = [];
            // sometimes voices are not loaded immediately
            const getVoices = () => {
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    allVoices.push(...voices);
                } else {
                    setTimeout(getVoices, 100);
                }
            };
            getVoices();
            while (allVoices.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const availableVoices = allVoices.filter(voice => voice.lang.split('-')[0] === validLang);
            if (availableVoices.length === 0) {
                throw new Error(`No available voices for lang: ${validLang}`)
            }
            let validVoiceURI = webSpeechSettings.voiceURI
            if (!availableVoices.some(voice => voice.voiceURI === validVoiceURI)) {
                validVoiceURI = availableVoices[0].voiceURI
            }
            return { lang: validLang, voiceURI: validVoiceURI }
        case 'azure':
            const azureSettings = unTypedSettings as { region?: string; subscriptionKey?: string; lang?: string; voiceName?: string }
            // validate region
            let validRegion = azureSettings.region || azureRegions[0]
            if (!azureRegions.includes(validRegion)) {
                validRegion = azureRegions[0]
            }
            // validate lang
            let validAzureLang = azureSettings.lang || 'en-US'
            if (!azureSpeechSynthesisLanguagesLocale[validAzureLang]) {
                validAzureLang = 'en-US'
            }
            // validate voiceName
            let validVoiceName = azureSettings.voiceName || azureSpeechSynthesisVoices[validAzureLang][0]
            if (!azureSpeechSynthesisVoices[validAzureLang].includes(validVoiceName)) {
                validVoiceName = azureSpeechSynthesisVoices[validAzureLang][0]
            }
            return { region: validRegion, lang: validAzureLang, voiceName: validVoiceName, ...azureSettings }
    }
    return {}
}

export function WebSpeechSettingsPanel({
    unTypedSettings,
    updateSettings
}: {
    unTypedSettings: object,
    updateSettings: (settings: Partial<{ lang: string; voiceURI: string }>) => void
}) {
    const { t } = useTranslation();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const settings = unTypedSettings as {
        lang: string;
        voiceURI: string;
    };

    // Load available voices
    useEffect(() => {
        async function loadVoices() {
            const allVoices = await WebSpeechTTS.getVoices();
            setVoices(allVoices);
        }
        loadVoices();
    }, []);

    const [testText, setTestText] = useState(t('What is the answer to life, the universe and everything?'));
    const [isPlaying, setIsPlaying] = useState(false);

    const playTestAudio = async () => {
        if (!window.speechSynthesis) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(testText);
        const voices = speechSynthesis.getVoices();

        if (settings.voiceURI) {
            const voice = voices.find(v => v.voiceURI === settings.voiceURI);
            if (voice) utterance.voice = voice;
        }

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    async function switchLang(lang: string) {
        const voices = await WebSpeechTTS.getVoices()
        const availableVoices = voices.filter(voice => voice.lang.split('-')[0] === lang);
        if (availableVoices.length === 0) {
            throw new Error(`No available voices for lang: ${lang}`)
        }
        updateSettings({ lang, voiceURI: availableVoices[0].voiceURI })
    }

    return <div className="flex flex-col pl-8">
        {/* Language selector */}
        <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-gray-700 font-bold">{t('Speech Language')}</span>
            <DropDownMenuV2
                entryLabel={speechSynthesisSystemLanguages[settings.lang as keyof typeof speechSynthesisSystemLanguages]}
                menuItems={Object.entries(speechSynthesisSystemLanguages).map(([key, value]) => ({
                    label: value,
                    onClick: () => { switchLang(key) }
                }))}
                menuClassName="right-0 max-h-96 overflow-y-auto"
            />
        </div>

        {/* Voice selector */}
        <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-gray-700 font-bold">{t('Speech Voice')}</span>
            <DropDownMenuV2
                entryLabel={voices.length > 0 ? voices.find(v => v.voiceURI === settings.voiceURI)?.name : 'Loading...'}
                menuItems={voices.filter(voice => voice.lang.split('-')[0] === settings.lang).map((voice) => ({
                    label: voice.name,
                    onClick: () => updateSettings({ ...settings, voiceURI: voice.voiceURI })
                }))}
                menuClassName="right-0"
            />
        </div>

        {/* Test area */}
        <div className="flex flex-col mt-6">
            <span className="text-gray-700 font-bold mb-2">{t('Test Speech')}</span>
            <div className="flex flex-row items-center gap-2">
                <input
                    type="text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder={t('Enter text to test speech')}
                    className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <div
                    onClick={playTestAudio}
                    className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {isPlaying
                        ? <IoStopCircleOutline size={24} />
                        : <PiSpeakerHighBold size={24} />
                    }
                </div>
            </div>
            <div className="flex flex-row items-center mt-2 text-sm text-gray-400">
                <IoMdInformationCircleOutline size={20} className="mr-2" />
                <span>{t('speechVoiceTestTip')}</span>
            </div>
        </div>
    </div>
}

function AzureTTSSettingsPanel({
    unTypedSettings,
    updateSettings
}: {
    unTypedSettings: object,
    updateSettings: (settings: Partial<{ region: string; subscriptionKey: string; lang: string; voiceName: string }>) => void
}) {
    const { t } = useTranslation();

    const settings = unTypedSettings as { region: string; subscriptionKey: string; lang: string; voiceName: string };

    // Get available voices based on selected language
    const availableVoices = useMemo(() => {
        return azureSpeechSynthesisVoices[settings.lang] || [];
    }, [settings.lang]);

    return (
        <div className="flex flex-col pl-8">
            {/* Azure Region */}
            <div className="flex flex-row items-center justify-between mb-4">
                <span className="text-gray-700 font-bold">{t('Azure Region')}</span>
                <DropDownMenuV2
                    entryLabel={settings.region}
                    menuItems={azureRegions.map((region) => ({
                        label: region,
                        onClick: () => updateSettings({ region })
                    }))}
                    menuClassName="right-0"
                />
            </div>
            {/* Subscription Key */}
            <div className="flex flex-col mb-4">
                <label className="text-gray-700 font-bold mb-2">{t('Subscription Key')}</label>
                <input
                    type="password"
                    value={settings.subscriptionKey || ''}
                    onChange={(e) => updateSettings({ subscriptionKey: e.target.value })}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder={t('Enter your Azure subscription key')}
                />
            </div>
            {/* Language Selection */}
            <div className="flex flex-row items-center justify-between mb-4">
                <span className="text-gray-700 font-bold">{t('Language')}</span>
                <DropDownMenuV2
                    entryLabel={azureSpeechSynthesisLanguagesLocale[settings.lang]}
                    menuItems={Object.entries(azureSpeechSynthesisLanguagesLocale).map(([langCode, langName]) => ({
                        label: langName,
                        onClick: () => updateSettings({ lang: langCode })
                    }))}
                    menuClassName="right-0 max-h-96 overflow-y-auto"
                />
            </div>
            {/* Voice Selection */}
            <div className="flex flex-row items-center justify-between mb-4">
                <span className="text-gray-700 font-bold">{t('Voice')}</span>
                <DropDownMenuV2
                    entryLabel={settings.voiceName || t('Default')}
                    menuItems={availableVoices.map((voice) => ({
                        label: voice,
                        onClick: () => updateSettings({ voiceName: voice })
                    }))}
                    menuClassName="right-0 max-h-96 overflow-y-auto"
                />
            </div>
        </div>
    );
}

// huge thanks to SpeechGPT
// copied from https://github.com/hahahumble/speechgpt/blob/main/src/constants/data.ts
const speechSynthesisSystemLanguages: { [key: string]: string } = {
    // System language names for tts
    zh: ' 中文 ', // Chinese
    en: 'English', // English
    it: 'Italiano', // Italian
    sv: 'Svenska', // Swedish
    fr: 'Français', // French
    ms: 'Bahasa Melayu', // Malay
    de: 'Deutsch', // German
    he: 'עברית', // Hebrew
    id: 'Bahasa Indonesia', // Indonesian
    bg: 'български', // Bulgarian
    es: 'Español', // Spanish
    fi: 'Suomi', // Finnish
    pt: 'Português', // Portuguese
    nl: 'Nederlands', // Dutch
    ro: 'Română', // Romanian
    th: 'ไทย', // Thai
    ja: ' 日本語 ', // Japanese
    hr: 'Hrvatski', // Croatian
    sk: 'Slovenčina', // Slovak
    hi: 'हिन्दी', // Hindi
    uk: 'Українська', // Ukrainian
    vi: 'Tiếng Việt', // Vietnamese
    ar: 'العربية', // Arabic
    hu: 'Magyar', // Hungarian
    el: 'Ελληνικά', // Greek
    ru: 'русский', // Russian
    ca: 'Català', // Catalan
    nb: 'Norsk Bokmål', // Norwegian Bokmål
    da: 'Dansk', // Danish
    tr: 'Türkçe', // Turkish
    ko: '한국어', // Korean
    pl: 'Polski', // Polish
    cs: 'Čeština', // Czech
    af: 'Afrikaans', // Afrikaans
    sq: 'Shqip', // Albanian
    am: 'አማርኛ', // Amharic
    az: 'Azərbaycan', // Azerbaijani
    bn: 'বাংলা', // Bengali
    bs: 'Bosanski', // Bosnian
    my: 'ဗမာ', // Burmese
    et: 'Eesti', // Estonian
    fil: 'Filipino', // Filipino
    gl: 'Galego', // Galician
    ka: 'ქართული', // Georgian
    gu: 'ગુજરાતી', // Gujarati
    is: 'Íslenska', // Icelandic
    ga: 'Gaeilge', // Irish
    jv: 'Basa Jawa', // Javanese
    kn: 'ಕನ್ನಡ', // Kannada
    kk: 'Қазақша', // Kazakh
    km: 'ភាាខ្មែរ', // Khmer
    lo: 'ລາວ', // Lao
    lv: 'Latviešu', // Latvian
    lt: 'Lietuvių', // Lithuanian
    mk: 'Македонски', // Macedonian
    ml: 'മലയാളം', // Malayalam
    mt: 'Malti', // Maltese
    mr: 'मराठी', // Marathi
    mn: 'Монгол', // Mongolian
    ne: 'नेपाली', // Nepali
    ps: 'پښتو', // Pashto
    fa: 'فارسی', // Persian
    sr: 'Српски', // Serbian
    si: 'සිංහල', // Sinhalese
    sl: 'Slovenščina', // Slovenian
    so: 'Soomaaliga', // Somali
    su: 'Basa Sunda', // Sundanese
    sw: 'Kiswahili', // Swahili
    ta: 'தமிழ்', // Tamil
    te: 'తెలుగు', // Telugu
    ur: 'اردو', // Urdu
    uz: 'Oʻzbekcha', // Uzbek
    cy: 'Cymraeg', // Welsh
    zu: 'isiZulu', // Zulu
};

// Azure TTS
const azureRegions = [
    'australiaeast',
    'australiasoutheast',
    'brazilsouth',
    'canadacentral',
    'canadaeast',
    'centralindia',
    'centralus',
    'eastasia',
    'eastus',
    'eastus2',
    'francecentral',
    'francesouth',
    'germanywestcentral',
    'japaneast',
    'japanwest',
    'koreacentral',
    'koreasouth',
    'northcentralus',
    'northeurope',
    'southafricanorth',
    'southafricawest',
    'southcentralus',
    'southindia',
    'southeastasia',
    'uksouth',
    'ukwest',
    'westcentralus',
    'westeurope',
    'westindia',
    'westus',
    'westus2',
];

const azureSpeechSynthesisLanguagesLocale: { [key: string]: string } = {
    'af-ZA': 'Afrikaans',
    'am-ET': 'አማርኛ',
    'ar-AE': 'العربية (الإمارات)',
    'ar-BH': 'العربية (البحرين)',
    'ar-DZ': 'العربية (الجزائر)',
    'ar-EG': 'العربية (مصر)',
    'ar-IQ': 'العربية (العراق)',
    'ar-JO': 'العربية (الأردن)',
    'ar-KW': 'العربية (الكويت)',
    'ar-LB': 'العربية (لبنان)',
    'ar-LY': 'العربية (ليبيا)',
    'ar-MA': 'العربية (المغرب)',
    'ar-OM': 'العربية (عمان)',
    'ar-QA': 'العربية (قطر)',
    'ar-SA': 'العربية (السعودية)',
    'ar-SY': 'العربية (سوريا)',
    'ar-TN': 'العربية (تونس)',
    'ar-YE': 'العربية (اليمن)',
    'az-AZ': 'Azərbaycanca',
    'bg-BG': 'български',
    'bn-BD': 'বাংলা (বাংলাদেশ)',
    'bn-IN': 'বাংলা (ভারত)',
    'bs-BA': 'Bosanski',
    'ca-ES': 'Català',
    'cs-CZ': 'Čeština',
    'cy-GB': 'Cymraeg',
    'da-DK': 'Dansk',
    'de-AT': 'Deutsch (Österreich)',
    'de-CH': 'Deutsch (Schweiz)',
    'de-DE': 'Deutsch (Deutschland)',
    'el-GR': 'Ελληνικά',
    'en-AU': 'English (Australia)',
    'en-CA': 'English (Canada)',
    'en-GB': 'English (UK)',
    'en-HK': 'English (Hong Kong)',
    'en-IE': 'English (Ireland)',
    'en-IN': 'English (India)',
    'en-KE': 'English (Kenya)',
    'en-NG': 'English (Nigeria)',
    'en-NZ': 'English (New Zealand)',
    'en-PH': 'English (Philippines)',
    'en-SG': 'English (Singapore)',
    'en-TZ': 'English (Tanzania)',
    'en-US': 'English (US)',
    'en-ZA': 'English (South Africa)',
    'es-AR': 'Español (Argentina)',
    'es-BO': 'Español (Bolivia)',
    'es-CL': 'Español (Chile)',
    'es-CO': 'Español (Colombia)',
    'es-CR': 'Español (Costa Rica)',
    'es-CU': 'Español (Cuba)',
    'es-DO': 'Español (República Dominicana)',
    'es-EC': 'Español (Ecuador)',
    'es-ES': 'Español (España)',
    'es-GQ': 'Español (Guinea Ecuatorial)',
    'es-GT': 'Español (Guatemala)',
    'es-HN': 'Español (Honduras)',
    'es-MX': 'Español (México)',
    'es-NI': 'Español (Nicaragua)',
    'es-PA': 'Español (Panamá)',
    'es-PE': 'Español (Perú)',
    'es-PR': 'Español (Puerto Rico)',
    'es-PY': 'Español (Paraguay)',
    'es-SV': 'Español (El Salvador)',
    'es-US': 'Español (Estados Unidos)',
    'es-UY': 'Español (Uruguay)',
    'es-VE': 'Español (Venezuela)',
    'et-EE': 'Eesti',
    'eu-ES': 'Euskara',
    'fa-IR': 'فارسی',
    'fi-FI': 'Suomi',
    'fil-PH': 'Filipino',
    'fr-BE': 'Français (Belgique)',
    'fr-CA': 'Français (Canada)',
    'fr-CH': 'Français (Suisse)',
    'fr-FR': 'Français (France)',
    'ga-IE': 'Gaeilge',
    'gl-ES': 'Galego',
    'gu-IN': 'ગુજરાતી',
    'he-IL': 'עברית',
    'hi-IN': 'हिन्दी',
    'hr-HR': 'Hrvatski',
    'hu-HU': 'Magyar',
    'hy-AM': 'Հայերեն',
    'id-ID': 'Bahasa Indonesia',
    'is-IS': 'Íslenska',
    'it-IT': 'Italiano',
    'ja-JP': '日本語',
    'jv-ID': 'Basa Jawa',
    'ka-GE': 'ქართული',
    'kk-KZ': 'Қазақ',
    'km-KH': 'ខ្មែរ',
    'kn-IN': 'ಕನ್ನಡ',
    'ko-KR': '한국어',
    'lo-LA': 'ລາວ',
    'lt-LT': 'Lietuvių',
    'lv-LV': 'Latviešu',
    'mk-MK': 'Македонски',
    'ml-IN': 'മലയാളം',
    'mn-MN': 'Монгол',
    'mr-IN': 'मराठी',
    'ms-MY': 'Bahasa Melayu',
    'mt-MT': 'Malti',
    'my-MM': 'မြန်မာ',
    'nb-NO': 'Norsk Bokmål',
    'ne-NP': 'नेपली',
    'nl-BE': 'Nederlands (België)',
    'nl-NL': 'Nederlands (Nederland)',
    'pl-PL': 'Polski',
    'ps-AF': 'پښتو',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'ro-RO': 'Română',
    'ru-RU': 'Русский',
    'si-LK': 'සිංහල',
    'sk-SK': 'Slovenčina',
    'sl-SI': 'Slovenščina',
    'so-SO': 'Soomaali',
    'sq-AL': 'Shqip',
    'sr-RS': 'Српски',
    'su-ID': 'Basa Sunda',
    'sv-SE': 'Svenska',
    'sw-KE': 'Kiswahili (Kenya)',
    'sw-TZ': 'Kiswahili (Tanzania)',
    'ta-IN': 'தமிழ் (இந்தியா)',
    'ta-LK': 'தமிழ் (இலங்கை)',
    'ta-MY': 'தமிழ் (மலேசியா)',
    'ta-SG': 'தமிழ் (சிங்கப்பூர்)',
    'te-IN': 'తెలుగు',
    'th-TH': 'ไทย',
    'tr-TR': 'Türkçe',
    'uk-UA': 'Українська',
    'ur-IN': 'اردو (بھارت)',
    'ur-PK': 'اردو (پاکستان)',
    'uz-UZ': "O'zbek",
    'vi-VN': 'Tiếng Việt',
    // "wuu-CN": "吴语",
    // "yue-CN": "粤语",
    'zh-CN': '中文 (中国)',
    'zh-CN-henan': '中文 (河南)',
    // "zh-CN-liaoning": "中文 (辽宁)",
    // "zh-CN-shaanxi": "中文 (陕西)",
    'zh-CN-shandong': '中文 (山东)',
    // "zh-CN-sichuan": "中文 (四川)",
    'zh-HK': '中文 (香港)',
    'zh-TW': '中文 (台湾)',
    'zu-ZA': 'isiZulu',
};

const azureSpeechSynthesisVoices: { [key: string]: string[] } = {
    'af-ZA': ['af-ZA-AdriNeural', 'af-ZA-WillemNeural'],
    'am-ET': ['am-ET-AmehaNeural', 'am-ET-MekdesNeural'],
    'ar-AE': ['ar-AE-FatimaNeural', 'ar-AE-HamdanNeural'],
    'ar-BH': ['ar-BH-AliNeural', 'ar-BH-LailaNeural'],
    'ar-DZ': ['ar-DZ-AminaNeural', 'ar-DZ-IsmaelNeural'],
    'ar-EG': ['ar-EG-SalmaNeural', 'ar-EG-ShakirNeural'],
    'ar-IQ': ['ar-IQ-BasselNeural', 'ar-IQ-RanaNeural'],
    'ar-JO': ['ar-JO-SanaNeural', 'ar-JO-TaimNeural'],
    'ar-KW': ['ar-KW-FahedNeural', 'ar-KW-NouraNeural'],
    'ar-LB': ['ar-LB-LaylaNeural', 'ar-LB-RamiNeural'],
    'ar-LY': ['ar-LY-ImanNeural', 'ar-LY-OmarNeural'],
    'ar-MA': ['ar-MA-JamalNeural', 'ar-MA-MounaNeural'],
    'ar-OM': ['ar-OM-AbdullahNeural', 'ar-OM-AyshaNeural'],
    'ar-QA': ['ar-QA-AmalNeural', 'ar-QA-MoazNeural'],
    'ar-SA': ['ar-SA-HamedNeural', 'ar-SA-ZariyahNeural'],
    'ar-SY': ['ar-SY-AmanyNeural', 'ar-SY-LaithNeural'],
    'ar-TN': ['ar-TN-HediNeural', 'ar-TN-ReemNeural'],
    'ar-YE': ['ar-YE-MaryamNeural', 'ar-YE-SalehNeural'],
    'az-AZ': ['az-AZ-BabekNeural', 'az-AZ-BanuNeural'],
    'bg-BG': ['bg-BG-BorislavNeural', 'bg-BG-KalinaNeural'],
    'bn-BD': ['bn-BD-NabanitaNeural', 'bn-BD-PradeepNeural'],
    'bn-IN': ['bn-IN-BashkarNeural', 'bn-IN-TanishaaNeural'],
    'bs-BA': ['bs-BA-GoranNeural', 'bs-BA-VesnaNeural'],
    'ca-ES': ['ca-ES-AlbaNeural', 'ca-ES-EnricNeural', 'ca-ES-JoanaNeural'],
    'cs-CZ': ['cs-CZ-AntoninNeural', 'cs-CZ-VlastaNeural'],
    'cy-GB': ['cy-GB-AledNeural', 'cy-GB-NiaNeural'],
    'da-DK': ['da-DK-ChristelNeural', 'da-DK-JeppeNeural'],
    'de-AT': ['de-AT-IngridNeural', 'de-AT-JonasNeural'],
    'de-CH': ['de-CH-JanNeural', 'de-CH-LeniNeural'],
    'de-DE': [
        'de-DE-AmalaNeural',
        'de-DE-BerndNeural',
        'de-DE-ChristophNeural',
        'de-DE-ConradNeural',
        'de-DE-ElkeNeural',
        'de-DE-GiselaNeural',
        'de-DE-KasperNeural',
        'de-DE-KatjaNeural',
        'de-DE-KillianNeural',
        'de-DE-KlarissaNeural',
        'de-DE-KlausNeural',
        'de-DE-LouisaNeural',
        'de-DE-MajaNeural',
        'de-DE-RalfNeural',
        'de-DE-TanjaNeural',
    ],
    'el-GR': ['el-GR-AthinaNeural', 'el-GR-NestorasNeural'],
    'en-AU': ['en-AU-NatashaNeural', 'en-AU-WilliamNeural'],
    'en-CA': ['en-CA-ClaraNeural', 'en-CA-LiamNeural'],
    'en-GB': [
        'en-GB-AbbiNeural',
        'en-GB-AlfieNeural',
        'en-GB-BellaNeural',
        'en-GB-ElliotNeural',
        'en-GB-EthanNeural',
        'en-GB-HollieNeural',
        'en-GB-LibbyNeural',
        'en-GB-MaisieNeural',
        'en-GB-NoahNeural',
        'en-GB-OliverNeural',
        'en-GB-OliviaNeural',
        'en-GB-ThomasNeural',
    ],
    'en-HK': ['en-HK-SamNeural', 'en-HK-YanNeural'],
    'en-IE': ['en-IE-ConnorNeural', 'en-IE-EmilyNeural'],
    'en-IN': ['en-IN-NeerjaNeural', 'en-IN-PrabhatNeural'],
    'en-KE': ['en-KE-AsiliaNeural', 'en-KE-ChilembaNeural'],
    'en-NG': ['en-NG-AbeoNeural', 'en-NG-EzinneNeural'],
    'en-NZ': ['en-NZ-MitchellNeural', 'en-NZ-MollyNeural'],
    'en-PH': ['en-PH-JamesNeural', 'en-PH-RosaNeural'],
    'en-SG': ['en-SG-LunaNeural', 'en-SG-WayneNeural'],
    'en-TZ': ['en-TZ-ElimuNeural', 'en-TZ-ImaniNeural'],
    'en-US': [
        'en-US-AmberNeural',
        'en-US-AnaNeural',
        'en-US-AriaNeural',
        'en-US-AshleyNeural',
        'en-US-BrandonNeural',
        'en-US-ChristopherNeural',
        'en-US-CoraNeural',
        'en-US-DavisNeural',
        'en-US-ElizabethNeural',
        'en-US-EricNeural',
        'en-US-GuyNeural',
        'en-US-JacobNeural',
        'en-US-JaneNeural',
        'en-US-JasonNeural',
        'en-US-JennyMultilingualNeural',
        'en-US-JennyNeural',
        'en-US-MichelleNeural',
        'en-US-MonicaNeural',
        'en-US-NancyNeural',
        'en-US-SaraNeural',
        'en-US-SteffanNeural',
        'en-US-TonyNeural',
    ],
    'en-ZA': ['en-ZA-LeahNeural', 'en-ZA-LukeNeural'],
    'es-AR': ['es-AR-ElenaNeural', 'es-AR-TomasNeural'],
    'es-BO': ['es-BO-MarceloNeural', 'es-BO-SofiaNeural'],
    'es-CL': ['es-CL-CatalinaNeural', 'es-CL-LorenzoNeural'],
    'es-CO': ['es-CO-GonzaloNeural', 'es-CO-SalomeNeural'],
    'es-CR': ['es-CR-JuanNeural', 'es-CR-MariaNeural'],
    'es-CU': ['es-CU-BelkysNeural', 'es-CU-ManuelNeural'],
    'es-DO': ['es-DO-EmilioNeural', 'es-DO-RamonaNeural'],
    'es-EC': ['es-EC-AndreaNeural', 'es-EC-LuisNeural'],
    'es-ES': ['es-ES-ElviraNeural'],
    'es-GQ': ['es-GQ-JavierNeural', 'es-GQ-TeresaNeural'],
    'es-GT': ['es-GT-AndresNeural', 'es-GT-MartaNeural'],
    'es-HN': ['es-HN-CarlosNeural', 'es-HN-KarlaNeural'],
    'es-MX': [
        'es-MX-BeatrizNeural',
        'es-MX-CandelaNeural',
        'es-MX-CarlotaNeural',
        'es-MX-CecilioNeural',
        'es-MX-DaliaNeural',
        'es-MX-GerardoNeural',
        'es-MX-LarissaNeural',
        'es-MX-LibertoNeural',
        'es-MX-LucianoNeural',
        'es-MX-MarinaNeural',
        'es-MX-NuriaNeural',
        'es-MX-PelayoNeural',
        'es-MX-RenataNeural',
        'es-MX-YagoNeural',
    ],
    'es-NI': ['es-NI-FedericoNeural', 'es-NI-YolandaNeural'],
    'es-PA': ['es-PA-MargaritaNeural', 'es-PA-RobertoNeural'],
    'es-PE': ['es-PE-AlexNeural', 'es-PE-CamilaNeural'],
    'es-PR': ['es-PR-KarinaNeural', 'es-PR-VictorNeural'],
    'es-PY': ['es-PY-MarioNeural', 'es-PY-TaniaNeural'],
    'es-SV': ['es-SV-LorenaNeural', 'es-SV-RodrigoNeural'],
    'es-US': ['es-US-AlonsoNeural', 'es-US-PalomaNeural'],
    'es-UY': ['es-UY-MateoNeural', 'es-UY-ValentinaNeural'],
    'es-VE': ['es-VE-PaolaNeural', 'es-VE-SebastianNeural'],
    'et-EE': ['et-EE-AnuNeural', 'et-EE-KertNeural'],
    'eu-ES': ['eu-ES-AinhoaNeural', 'eu-ES-AnderNeural'],
    'fa-IR': ['fa-IR-DilaraNeural', 'fa-IR-FaridNeural'],
    'fi-FI': ['fi-FI-HarriNeural', 'fi-FI-NooraNeural', 'fi-FI-SelmaNeural'],
    'fil-PH': ['fil-PH-AngeloNeural', 'fil-PH-BlessicaNeural'],
    'fr-BE': ['fr-BE-CharlineNeural', 'fr-BE-GerardNeural'],
    'fr-CA': ['fr-CA-AntoineNeural', 'fr-CA-JeanNeural', 'fr-CA-SylvieNeural'],
    'fr-CH': ['fr-CH-ArianeNeural', 'fr-CH-FabriceNeural'],
    'fr-FR': [
        'fr-FR-AlainNeural',
        'fr-FR-BrigitteNeural',
        'fr-FR-CelesteNeural',
        'fr-FR-ClaudeNeural',
        'fr-FR-CoralieNeural',
        'fr-FR-EloiseNeural',
        'fr-FR-JacquelineNeural',
        'fr-FR-JeromeNeural',
        'fr-FR-JosephineNeural',
        'fr-FR-MauriceNeural',
        'fr-FR-YvesNeural',
        'fr-FR-YvetteNeural',
    ],
    'ga-IE': ['ga-IE-ColmNeural', 'ga-IE-OrlaNeural'],
    'gl-ES': ['gl-ES-RoiNeural', 'gl-ES-SabelaNeural'],
    'gu-IN': ['gu-IN-DhwaniNeural', 'gu-IN-NiranjanNeural'],
    'he-IL': ['he-IL-AvriNeural', 'he-IL-HilaNeural'],
    'hi-IN': ['hi-IN-MadhurNeural', 'hi-IN-SwaraNeural'],
    'hr-HR': ['hr-HR-GabrijelaNeural', 'hr-HR-SreckoNeural'],
    'hu-HU': ['hu-HU-NoemiNeural', 'hu-HU-TamasNeural'],
    'hy-AM': ['hy-AM-AnahitNeural', 'hy-AM-HaykNeural'],
    'id-ID': ['id-ID-ArdiNeural', 'id-ID-GadisNeural'],
    'is-IS': ['is-IS-GudrunNeural', 'is-IS-GunnarNeural'],
    'it-IT': [
        'it-IT-BenignoNeural',
        'it-IT-CalimeroNeural',
        'it-IT-CataldoNeural',
        'it-IT-ElsaNeural',
        'it-IT-FabiolaNeural',
        'it-IT-FiammaNeural',
        'it-IT-GianniNeural',
        'it-IT-ImeldaNeural',
        'it-IT-IrmaNeural',
        'it-IT-LisandroNeural',
        'it-IT-PalmiraNeural',
        'it-IT-PierinaNeural',
        'it-IT-RinaldoNeural',
    ],
    'ja-JP': ['ja-JP-KeitaNeural', 'ja-JP-NanamiNeural'],
    'jv-ID': ['jv-ID-DimasNeural', 'jv-ID-SitiNeural'],
    'ka-GE': ['ka-GE-EkaNeural', 'ka-GE-GiorgiNeural'],
    'kk-KZ': ['kk-KZ-AigulNeural', 'kk-KZ-DauletNeural'],
    'km-KH': ['km-KH-PisethNeural', 'km-KH-SreymomNeural'],
    'kn-IN': ['kn-IN-GaganNeural', 'kn-IN-SapnaNeural'],
    'ko-KR': ['ko-KR-InJoonNeural', 'ko-KR-SunHiNeural'],
    'lo-LA': ['lo-LA-ChanthavongNeural', 'lo-LA-KeomanyNeural'],
    'lt-LT': ['lt-LT-LeonasNeural', 'lt-LT-OnaNeural'],
    'lv-LV': ['lv-LV-EveritaNeural', 'lv-LV-NilsNeural'],
    'mk-MK': ['mk-MK-AleksandarNeural', 'mk-MK-MarijaNeural'],
    'ml-IN': ['ml-IN-MidhunNeural', 'ml-IN-SobhanaNeural'],
    'mn-MN': ['mn-MN-BataaNeural', 'mn-MN-YesuiNeural'],
    'mr-IN': ['mr-IN-AarohiNeural', 'mr-IN-ManoharNeural'],
    'ms-MY': ['ms-MY-OsmanNeural', 'ms-MY-YasminNeural'],
    'mt-MT': ['mt-MT-GraceNeural', 'mt-MT-JosephNeural'],
    'my-MM': ['my-MM-NilarNeural', 'my-MM-ThihaNeural'],
    'nb-NO': ['nb-NO-FinnNeural', 'nb-NO-IselinNeural', 'nb-NO-PernilleNeural'],
    'ne-NP': ['ne-NP-HemkalaNeural', 'ne-NP-SagarNeural'],
    'nl-BE': ['nl-BE-ArnaudNeural', 'nl-BE-DenaNeural'],
    'nl-NL': ['nl-NL-ColetteNeural'],
    'pl-PL': ['pl-PL-AgnieszkaNeural', 'pl-PL-MarekNeural', 'pl-PL-ZofiaNeural'],
    'ps-AF': ['ps-AF-GulNawazNeural', 'ps-AF-LatifaNeural'],
    'pt-BR': [
        'pt-BR-AntonioNeural',
        'pt-BR-BrendaNeural',
        'pt-BR-DonatoNeural',
        'pt-BR-ElzaNeural',
        'pt-BR-FabioNeural',
        'pt-BR-FranciscaNeural',
        'pt-BR-GiovannaNeural',
        'pt-BR-HumbertoNeural',
        'pt-BR-JulioNeural',
        'pt-BR-LeilaNeural',
        'pt-BR-LeticiaNeural',
        'pt-BR-ManuelaNeural',
        'pt-BR-NicolauNeural',
        'pt-BR-ValerioNeural',
        'pt-BR-YaraNeural',
    ],
    'pt-PT': ['pt-PT-DuarteNeural', 'pt-PT-FernandaNeural', 'pt-PT-RaquelNeural'],
    'ro-RO': ['ro-RO-AlinaNeural', 'ro-RO-EmilNeural'],
    'ru-RU': ['ru-RU-DariyaNeural', 'ru-RU-DmitryNeural', 'ru-RU-SvetlanaNeural'],
    'si-LK': ['si-LK-SameeraNeural', 'si-LK-ThiliniNeural'],
    'sk-SK': ['sk-SK-LukasNeural', 'sk-SK-ViktoriaNeural'],
    'sl-SI': ['sl-SI-PetraNeural', 'sl-SI-RokNeural'],
    'so-SO': ['so-SO-MuuseNeural', 'so-SO-UbaxNeural'],
    'sq-AL': ['sq-AL-AnilaNeural', 'sq-AL-IlirNeural'],
    'sr-RS': ['sr-RS-NicholasNeural', 'sr-RS-SophieNeural'],
    'su-ID': ['su-ID-JajangNeural', 'su-ID-TutiNeural'],
    'sv-SE': ['sv-SE-HilleviNeural', 'sv-SE-MattiasNeural', 'sv-SE-SofieNeural'],
    'sw-KE': ['sw-KE-RafikiNeural', 'sw-KE-ZuriNeural'],
    'sw-TZ': ['sw-TZ-DaudiNeural', 'sw-TZ-RehemaNeural'],
    'ta-IN': ['ta-IN-PallaviNeural', 'ta-IN-ValluvarNeural'],
    'ta-LK': ['ta-LK-KumarNeural', 'ta-LK-SaranyaNeural'],
    'ta-MY': ['ta-MY-KaniNeural', 'ta-MY-SuryaNeural'],
    'ta-SG': ['ta-SG-AnbuNeural', 'ta-SG-VenbaNeural'],
    'te-IN': ['te-IN-MohanNeural', 'te-IN-ShrutiNeural'],
    'th-TH': ['th-TH-AcharaNeural', 'th-TH-NiwatNeural', 'th-TH-PremwadeeNeural'],
    'tr-TR': ['tr-TR-AhmetNeural', 'tr-TR-EmelNeural'],
    'uk-UA': ['uk-UA-OstapNeural', 'uk-UA-PolinaNeural'],
    'ur-IN': ['ur-IN-GulNeural', 'ur-IN-SalmanNeural'],
    'ur-PK': ['ur-PK-AsadNeural', 'ur-PK-UzmaNeural'],
    'uz-UZ': ['uz-UZ-MadinaNeural', 'uz-UZ-SardorNeural'],
    'vi-VN': ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'],
    'zh-CN': [
        'zh-CN-XiaochenNeural',
        'zh-CN-XiaohanNeural',
        'zh-CN-XiaomengNeural',
        'zh-CN-XiaomoNeural',
        'zh-CN-XiaoqiuNeural',
        'zh-CN-XiaoruiNeural',
        'zh-CN-XiaoshuangNeural',
        'zh-CN-XiaoxiaoNeural',
        'zh-CN-XiaoxuanNeural',
        'zh-CN-XiaoyanNeural',
        'zh-CN-XiaoyiNeural',
        'zh-CN-XiaoyouNeural',
        'zh-CN-XiaozhenNeural',
        'zh-CN-YunfengNeural',
        'zh-CN-YunhaoNeural',
        'zh-CN-YunjianNeural',
        'zh-CN-YunxiaNeural',
        'zh-CN-YunxiNeural',
        'zh-CN-YunyangNeural',
        'zh-CN-YunyeNeural',
        'zh-CN-YunzeNeural',
    ],
    'zh-CN-henan': ['zh-CN-henan-YundengNeural'],
    'zh-CN-shandong': ['zh-CN-shandong-YunxiangNeural'],
    'zh-HK': ['zh-HK-HiuGaaiNeural', 'zh-HK-HiuMaanNeural'],
    'zh-TW': ['zh-TW-HsiaoChenNeural', 'zh-TW-HsiaoYuNeural', 'zh-TW-YunJheNeural'],
    'zu-ZA': ['zu-ZA-ThandoNeural', 'zu-ZA-ThembaNeural'],
};

function FreeTrialSettings() {
    const { t } = useTranslation();
    return <div className="flex flex-col">
        <div className="flex flex-row items-start mt-2 mb-4 text-sm text-gray-500">
            <IoMdInformationCircleOutline size={15} className="mr-2 mt-1 flex-shrink-0" />
            <span>{t('freeTrial.ttsServiceTip')}</span>
        </div>
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

    useEffect(() => {
        const defaultSvcs = getLLMServiceSettings()
        setCompState({ llmServices: defaultSvcs, selectedSvcId: defaultSvcs.length > 0 ? defaultSvcs[0].id : null })
    }, [])

    const updateSettings = (serviceId: string, settings: object) => {
        updateLLMServiceSettings(serviceId, settings)
        setCompState({
            llmServices: compState.llmServices.map((svc) => svc.id === serviceId ? { ...svc, settings } : svc),
            selectedSvcId: compState.selectedSvcId,
        })
    }
    function addLLMServiceAndSwitchToIt() {
        const serviceName = t('Custom Service')
        // save data
        const newServiceRecord = addCustomLLMServiceSettings({
            type: OpenAICompatibleAPIService.type,
            settings: { name: serviceName },
        })
        // load the new service
        setCompState({
            llmServices: compState.llmServices.concat(newServiceRecord),
            selectedSvcId: newServiceRecord.id,
        })
    }

    return <div className="flex flex-col pl-8">
        <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-gray-700 font-bold">{t('Models Service')}</span>
            <DropDownMenuV2
                entryLabel={selectedSvc ? <I18nText i18nText={selectedSvc.name} /> : 'No LLM Service'}
                menuItems={
                    [
                        ...compState.llmServices.map((service) => ({
                            label: <div className="flex flex-row items-center"><TbCloud color="gray" className="mr-2" /><I18nText i18nText={service.name} /></div>,
                            onClick: () => { setCompState({ ...compState, selectedSvcId: service.id }) }
                        })),
                        {
                            label: <div className="flex flex-row items-center">
                                <TbCloudPlus className="mr-2" color="gray" />
                                <span className="text-gray-500">{t('Add Service')}</span>
                            </div>, onClick: () => { addLLMServiceAndSwitchToIt() }
                        }
                    ]}
                menuClassName="right-0"
            />
        </div>
        {selectedSvc?.type && SettingsComponent && <SettingsComponent key={selectedSvc.id} settings={selectedSvc.settings}
            updateSettings={(settings) => { updateSettings(selectedSvc.id, settings) }} />}
    </div>
}