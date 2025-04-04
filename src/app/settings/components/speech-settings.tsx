
export function getSelectedSpeechSvcID() {
    const freeTrialSvcEnabled = !!(process.env.NEXT_PUBLIC_ENABLE_FREE_TRIAL_TTS && process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION);
    const defaultSvcId = freeTrialSvcEnabled ? 'freeTrial' : 'webSpeech';
    const selectedSvcId = localStorage.getItem('selectedSpeechServiceId') || defaultSvcId;
    if (selectedSvcId === 'freeTrial' && !freeTrialSvcEnabled) {
        return defaultSvcId;
    }
    return selectedSvcId;
}

// load speech settings from local storage, and automatically correct invalid settings with default values
export async function getSpeechSvcSettings(svcId: string): Promise<object> {
    const saved = localStorage.getItem(`speechSettings-${svcId}`);
    const unTypedSettings = saved ? JSON.parse(saved) : {};
    switch (svcId) {
        case 'freeTrial':
            return {};
        case 'webSpeech':
            const webSpeechSettings = unTypedSettings as { lang?: string; voiceURI?: string; };
            // validate lang
            let validLang = webSpeechSettings.lang || 'en';
            if (!speechSynthesisSystemLanguages[validLang]) {
                validLang = 'en';
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
                throw new Error(`No available voices for lang: ${validLang}`);
            }
            let validVoiceURI = webSpeechSettings.voiceURI;
            if (!availableVoices.some(voice => voice.voiceURI === validVoiceURI)) {
                validVoiceURI = availableVoices[0].voiceURI;
            }
            return { lang: validLang, voiceURI: validVoiceURI };
        case 'azure':
            const azureSettings = unTypedSettings as { region?: string; subscriptionKey?: string; lang?: string; voiceName?: string; };
            // validate region
            let validRegion = azureSettings.region || azureRegions[0];
            if (!azureRegions.includes(validRegion)) {
                validRegion = azureRegions[0];
            }
            // validate lang
            let validAzureLang = azureSettings.lang || 'en-US';
            if (!azureSpeechSynthesisLanguagesLocale[validAzureLang]) {
                validAzureLang = 'en-US';
            }
            // validate voiceName
            let validVoiceName = azureSettings.voiceName || azureSpeechSynthesisVoices[validAzureLang][0];
            if (!azureSpeechSynthesisVoices[validAzureLang].includes(validVoiceName)) {
                validVoiceName = azureSpeechSynthesisVoices[validAzureLang][0];
            }
            return { region: validRegion, lang: validAzureLang, voiceName: validVoiceName, ...azureSettings };
    }
    return {};
}

// huge thanks to SpeechGPT
// copied from https://github.com/hahahumble/speechgpt/blob/main/src/constants/data.ts
export const speechSynthesisSystemLanguages: { [key: string]: string; } = {
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
export const azureRegions = [
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

export const azureSpeechSynthesisLanguagesLocale: { [key: string]: string; } = {
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

export const azureSpeechSynthesisVoices: { [key: string]: string[]; } = {
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

