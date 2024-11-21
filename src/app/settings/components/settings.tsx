'use client'

import { LuSettings } from "react-icons/lu";
import { useEffect, useState, useMemo } from 'react';
import { IoMdClose, IoMdInformationCircleOutline } from "react-icons/io";
import { useTranslation } from "react-i18next";
import i18n, { i18nText, I18nText } from '../../i18n/i18n';
import { DropDownMenuV2 } from "@/app/ui-utils/components/DropdownMenu";
import { addCustomLLMServiceSettings, getLLMServiceSettings, LLMServiceSettingsRecord, OpenAICompatibleAPIService, updateLLMServiceSettings } from "@/app/intelligence-llm/lib/llm-service";
import { getLLMSettingsComponent } from "@/app/intelligence-llm/components/llm-service";
import { ChatSettings, loadGlobalChatSettings, setGlobalChatSettings } from "@/app/chat/lib/chat";
import { getAvailableChatIntelligenceSettings, getChatIntelligenceSettingsByID, OpenAIChatIntelligence } from "@/app/intelligence-llm/lib/intelligence";
import { InputHandler } from "@/app/chat/components/input-handlers";
import { CustomLLMChatISettings, OpenAIChatISettings } from "@/app/intelligence-llm/components/intelligence";
import Switch from "react-switch";
import { IconCircleWrapper } from "@/app/chat/components/message";
import { PiTrashBold } from "react-icons/pi";
import { Tooltip } from "react-tooltip";
import { TbCloud, TbCloudPlus } from "react-icons/tb";
import { IoStopCircleOutline } from "react-icons/io5";
import { PiSpeakerHighBold } from "react-icons/pi";

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

    const [chatSettings, setChatSettings] = useState(loadGlobalChatSettings())
    return <CommonChatSettings chatSettings={chatSettings} updateChatSettings={(newChatSettings) => {
        setChatSettings(newChatSettings)
        setGlobalChatSettings(newChatSettings)
    }} />
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
        {chatSettingsRO.chatISettings.chatIType === OpenAIChatIntelligence.type &&
            <div className="flex flex-col mb-4">
                <OpenAIChatISettings settings={chatSettingsRO.chatISettings.settings}
                    updateChatISettings={updateSelectedChatISettings} />
            </div>
        }
        {chatSettingsRO.chatISettings.chatIType === 'customLLMSvc' &&
            <div className="flex flex-col mb-4">
                <CustomLLMChatISettings key={chatSettingsRO.chatISettings.id} settings={chatSettingsRO.chatISettings.settings}
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
function SpeechSettings() {
    const { t } = useTranslation();

    // TODO tech-debt: abstraction and layering

    const availableSpeechSvcs = [
        { id: 'webSpeech', name: { text: '浏览器内置 TTS' } },
        { id: 'azure', name: { text: 'Azure TTS' } },
    ]

    const freeTrialSvcEnabled = !!(process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION)
    if (freeTrialSvcEnabled) {
        availableSpeechSvcs.unshift({ id: 'freeTrial', name: { text: '体验用' } })
    }

    const defaultSvcId = (() => {
        // 优先使用 freeTrial (如果可用)
        if (freeTrialSvcEnabled) {
            return 'freeTrial'
        }
        // 否则使用浏览器内置服务
        return 'webSpeech'
    })()

    const [selectedSvcId, setSelectedSvcId] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedSpeechServiceId')
            if (saved === 'freeTrial' && !freeTrialSvcEnabled) {
                localStorage.setItem('selectedSpeechServiceId', defaultSvcId)
                return defaultSvcId
            }
            if (!saved) {
                localStorage.setItem('selectedSpeechServiceId', defaultSvcId)
                return defaultSvcId
            }
            return saved
        }
        return defaultSvcId
    });

    function changeSpeechSvc(svcId: string) {
        setSelectedSvcId(svcId)
        localStorage.setItem('selectedSpeechServiceId', svcId)
    }
    // 添加 WebSpeech 设置的状态管理
    const [speechSettings, setSpeechSettings] = useState<object>(() => (
        getSpeechSvcSettings(selectedSvcId)
    ));

    const updateSpeechSettings = (svcId: string, newSettings: Partial<object>) => {
        const updatedSettings = { ...speechSettings, ...newSettings };
        setSpeechSettings(updatedSettings);
        // 更新 localStorage
        localStorage.setItem(`speechSettings-${svcId}`, JSON.stringify(updatedSettings));
    };


    function getSpeechSvcSettings(svcId: string) {
        const saved = localStorage.getItem(`speechSettings-${svcId}`)
        return saved ? JSON.parse(saved) : {}
    }

    return <div>
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
                updateSettings={(newSettings) => updateSpeechSettings(selectedSvcId, newSettings)}
            />
        }
    </div>
}


function WebSpeechSettingsPanel({
    unTypedSettings,
    updateSettings
}: {
    unTypedSettings: object,
    updateSettings: (settings: Partial<{ lang: string; voiceURI: string }>) => void
}) {
    const { t } = useTranslation();

    // 声音选择状态
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // 验证和修正设置
    const settings = useMemo(() => {
        const typedSettings = unTypedSettings as {
            lang?: string;
            voiceURI?: string;
        };

        // 默认设置
        const defaultSettings = {
            lang: 'en',
            voiceURI: ''
        };

        // 验证语言是否有效
        const isValidLang = (lang?: string) => {
            return lang && speechSynthesisSystemLanguages[lang];
        };

        // 验证声音是否有效
        const isValidVoice = (voiceURI?: string) => {
            if (!voiceURI) return true; // 空字符串是有效的（表示默认声音）
            return voices.some(v => v.voiceURI === voiceURI);
        };

        // 构建有效的设置对象
        const validSettings = {
            lang: isValidLang(typedSettings.lang) ? typedSettings.lang : defaultSettings.lang,
            voiceURI: isValidVoice(typedSettings.voiceURI) ? typedSettings.voiceURI : defaultSettings.voiceURI
        };

        // 如果设置无效，更新存储的设置
        if (validSettings.lang !== typedSettings.lang || validSettings.voiceURI !== typedSettings.voiceURI) {
            updateSettings(validSettings);
        }

        return validSettings;
    }, [unTypedSettings, voices, updateSettings]);

    // 初始化和更新可用的声音列表
    useEffect(() => {
        function loadVoices() {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        }
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // 获取当前语言可用的声音
    const availableVoices = useMemo(() => {
        return voices.filter(voice => voice.lang.split('-')[0] === settings.lang);
    }, [voices, settings.lang]);

    // 如果当前选择的声音不在可用列表中，重置为默认值
    useEffect(() => {
        if (settings.voiceURI && !availableVoices.some(v => v.voiceURI === settings.voiceURI)) {
            updateSettings({ voiceURI: '' });
        }
    }, [availableVoices, settings.voiceURI, updateSettings]);

    const [testText, setTestText] = useState(t('What is the answer to life, the universe and everything?'));
    const [isPlaying, setIsPlaying] = useState(false);

    const playTestAudio = () => {
        if (!window.speechSynthesis) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(testText);

        if (settings.voiceURI) {
            const voice = voices.find(v => v.voiceURI === settings.voiceURI);
            if (voice) utterance.voice = voice;
        }

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    return <div className="flex flex-col pl-8">
        {/* Language selector */}
        <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-gray-700 font-bold">{t('Speech Language')}</span>
            <DropDownMenuV2
                entryLabel={speechSynthesisSystemLanguages[settings.lang as keyof typeof speechSynthesisSystemLanguages]}
                menuItems={Object.entries(speechSynthesisSystemLanguages).map(([key, value]) => ({
                    label: value,
                    onClick: () => {
                        updateSettings({
                            lang: key,
                            voiceURI: '' // 重置声音选择
                        });
                    }
                }))}
                menuClassName="right-0 max-h-96 overflow-y-auto"
            />
        </div>

        {/* Voice selector */}
        <div className="flex flex-row items-center justify-between mb-4">
            <span className="text-gray-700 font-bold">{t('Speech Voice')}</span>
            <DropDownMenuV2
                entryLabel={availableVoices.find(v => v.voiceURI === settings.voiceURI)?.name || t('Default')}
                menuItems={[
                    { label: t('Default'), onClick: () => updateSettings({ voiceURI: '' }) },
                    ...availableVoices.map(voice => ({
                        label: voice.name,
                        onClick: () => updateSettings({ voiceURI: voice.voiceURI })
                    }))
                ]}
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
    km: 'ភាសាខ្មែរ', // Khmer
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