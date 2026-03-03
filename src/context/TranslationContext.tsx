import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "kn" | "hi" | "te" | "ta";

interface Translations {
    [key: string]: {
        [K in Language]: string;
    };
}

const translations: Translations = {
    welcome: {
        en: "Welcome back",
        kn: "ಮತ್ತೆ ಸ್ವಾಗತ",
        hi: "स्वागत है",
        te: "మళ్ళీ స్వాగతం",
        ta: "மீண்டும் வருக",
    },
    hero_title: {
        en: "Civic Lens",
        kn: "ಸಿವಿಕ್ ಲೆನ್ಸ್",
        hi: "सिविक लेंस",
        te: "సివిక్ లెన్స్",
        ta: "சிவிக் லென்ஸ்",
    },
    hero_desc: {
        en: "Help improve your city. Report civic issues and track their resolution.",
        kn: "ನಿಮ್ಮ ನಗರವನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಿ. ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ಅವುಗಳ ಪರಿಹಾರವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
        hi: "अपने शहर को बेहतर बनाने में मदद करें। नागरिक समस्याओं की रिपोर्ट करें और उनके समाधान को ट्रैक करें।",
        te: "మీ నగరాన్ని మెరుగుపరచడంలో సహాయపడండి. పౌర సమస్యలను నివేదించండి మరియు వాటి పరిష్కారాన్ని ట్రాక్ చేయండి.",
        ta: "உங்கள் நகரத்தை மேம்படுத்த உதவுங்கள். குடிமைச் சிக்கல்களைப் புகாரளிக்கவும் மற்றும் அவற்றின் தீர்வை கண்காணிக்கவும்.",
    },
    report_issue: {
        en: "Report an Issue",
        kn: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
        hi: "एक मुद्दा रिपोर्ट करें",
        te: "ఒక సమస్యను నివేదించండి",
        ta: "ஒரு சிக்கலைப் புகாரளிக்கவும்",
    },
    geo_intel: {
        en: "Geo Intelligence",
        kn: "ಜಿಯೋ ಇಂಟೆಲಿಜೆನ್ಸ್",
        hi: "जियो इंटेलिजेंस",
        te: "జియో ఇంటెలిజెన్స్",
        ta: "ஜியோ இன்டெலிஜென்ஸ்",
    },
    track_progress: {
        en: "Track Progress",
        kn: "ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
        hi: "प्रगति ट्रैक करें",
        te: "పురోగతిని ట్రాక్ చేయండి",
        ta: "முன்னேற்றத்தைக் கண்காணிக்கவும்",
    },
    community: {
        en: "Community",
        kn: "ಸಮುದಾಯ",
        hi: "समुदाय",
        te: "సముదాయం",
        ta: "சமூகம்",
    },
    profile: {
        en: "Profile",
        kn: "ಪ್ರೊಫೈಲ್",
        hi: "प्रोफ़ाइल",
        te: "ప్రొఫైల్",
        ta: "சுயವಿவரம்",
    },
    home: {
        en: "Home",
        kn: "ಮನೆ",
        hi: "होम",
        te: "హోమ్",
        ta: "முகப்பு",
    },
    map: {
        en: "Map",
        kn: "ನಕ್ಷೆ",
        hi: "नक्शा",
        te: "మ్యాప్",
        ta: "வரைபடம்",
    },
    details_tab: {
        en: "Details",
        kn: "ವಿವರಗಳು",
        hi: "विवरण",
        te: "వివరాలు",
        ta: "விவரங்கள்",
    },
    timeline_tab: {
        en: "Timeline",
        kn: "ಸಮಯದ ಪ್ರಗತಿ",
        hi: "समयरेखा",
        te: "టైమ్‌లైన్",
        ta: "காலவரிசை",
    },
    severity: {
        en: "Severity",
        kn: "ಗಂಭೀರತೆ",
        hi: "गंभीरता",
        te: "తీవ్రత",
        ta: "தீவிரம்",
    },
    status: {
        en: "Status",
        kn: "ಸ್ಥಿತಿ",
        hi: "स्थिति",
        te: "స్థితి",
        ta: "நிலை",
    },
    description: {
        en: "Description",
        kn: "ವಿವರಣೆ",
        hi: "विवरण",
        te: "ವಿవరణ",
        ta: "விளக்கம்",
    },
    recent_reports: {
        en: "Recently Reported",
        kn: "ಇತ್ತೀಚೆಗೆ ವರದಿ ಮಾಡಲಾಗಿದೆ",
        hi: "हाल ही में रिपोर्ट की गई",
        te: "ఇటీవల నివేదించబడినవి",
        ta: "சமீபத்தில் புகாரளிக்கப்பட்டது",
    },
    view_map: {
        en: "View map",
        kn: "ನಕ್ಷೆಯನ್ನು ನೋಡಿ",
        hi: "नक्शा देखें",
        te: "మ్యాప్ చూడండి",
        ta: "வரைபடத்தைப் பார்க்கவும்",
    },
    active: {
        en: "Active",
        kn: "ಸಕ್ರಿಯ",
        hi: "सक्रिय",
        te: "క్రియాశీల",
        ta: "செயலில்",
    },
    resolved: {
        en: "Resolved",
        kn: "ಪರಿಹರಿಸಲಾಗಿದೆ",
        hi: "हल किया गया",
        te: "పరిష్కరించబడింది",
        ta: "தீர்வு காணப்பட்டது",
    },
    search_placeholder: {
        en: "Search issues...",
        kn: "ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...",
        hi: "मुद्दे खोजें...",
        te: "సమస్యలను వెతకండి...",
        ta: "சிக்கல்களைத் தேடுங்கள்...",
    },
    pothole: {
        en: "Pothole",
        kn: "ಗುಂಡಿ",
        hi: "गड्डा",
        te: "గుంత",
        ta: "பள்ளம்",
    },
    drainage: {
        en: "Drainage",
        kn: "ಚರಂಡಿ",
        hi: "जल निकासी",
        te: "డ్రైనేజీ",
        ta: "வடிகால்",
    },
    streetlight: {
        en: "Streetlight",
        kn: "ಬೀದಿ ದೀಪ",
        hi: "स्ट्रीट लाइट",
        te: "వీధి దీపం",
        ta: "தெரு விளக்கு",
    },
    flooding: {
        en: "Flooding",
        kn: "ಪ್ರವಾಹ",
        hi: "बाढ़",
        te: "వరద",
        ta: "வெள்ளம்",
    },
    vegetation: {
        en: "Vegetation",
        kn: "ಸಸ್ಯವರ್ಗ",
        hi: "वनस्पति",
        te: "వృక్షసంపద",
        ta: "தாவரங்கள்",
    },
    construction: {
        en: "Construction",
        kn: "ನಿರ್ಮಾಣ",
        hi: "निर्माण",
        te: "నిర్మాణం",
        ta: "கட்டுமானம்",
    },
    encroachment: {
        en: "Encroachment",
        kn: "ಅತಿಕ್ರಮಣ",
        hi: "अतिक्रमण",
        te: "ఆక్రమణ",
        ta: "ஆக்கிரமிப்பு",
    },
    sewage: {
        en: "Sewage",
        kn: "ಒಳಚರಂಡಿ",
        hi: "सीवेज",
        te: "మురుగునీరు",
        ta: "சாக்கடை",
    },
    low: {
        en: "Low",
        kn: "ಕಡಿಮೆ",
        hi: "कम",
        te: "తక్కువ",
        ta: "குறைவு",
    },
    medium: {
        en: "Medium",
        kn: "ಮಧ್ಯಮ",
        hi: "मध्यम",
        te: "మధ్యస్థ",
        ta: "நடுத்தரம்",
    },
    high: {
        en: "High",
        kn: "ಹೆಚ್ಚು",
        hi: "उच्च",
        te: "ఎక్కువ",
        ta: "அதிகம்",
    },
    reported: {
        en: "Reported",
        kn: "ವರದಿ ಮಾಡಲಾಗಿದೆ",
        hi: "रिपोर्ट की गई",
        te: "నివేదించబడింది",
        ta: "புகாரளிக்கப்பட்டது",
    },
    in_progress: {
        en: "In Progress",
        kn: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
        hi: "प्रगति में है",
        te: "పురోగతిలో ఉంది",
        ta: "நடப்பில் உள்ளது",
    },
    verified_categorized: {
        en: "Verified & Categorized",
        kn: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ವರ್ಗೀಕರಿಸಲಾಗಿದೆ",
        hi: "सत्यापित और वर्गीकृत",
        te: "ధృవీకరించబడింది & వర్గీకరించబడింది",
        ta: "சரிபார்க்கப்பட்டது மற்றும் வகைப்படுத்தப்பட்டது",
    },
    assigned: {
        en: "Technician Assigned",
        kn: "ತಂತ್ರಜ್ಞರನ್ನು ನಿಯೋಜಿಸಲಾಗಿದೆ",
        hi: "तकनीशियन नियुक्त",
        te: "టెక్నీషియన్ కేటాయించబడింది",
        ta: "தொழில்நுட்ப வல்லுநர் நியமிக்கப்பட்டார்",
    },
    completed: {
        en: "Work Completed",
        kn: "ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ",
        hi: "कार्य पूर्ण",
        te: "పని పూర్తయింది",
        ta: "வேலை முடிந்தது",
    }
};

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem("app-language");
        return (saved as Language) || "en";
    });

    useEffect(() => {
        localStorage.setItem("app-language", language);
    }, [language]);

    const t = (key: string) => {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        if (!translations[normalizedKey]) return key;
        return translations[normalizedKey][language] || translations[normalizedKey]["en"];
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
};
