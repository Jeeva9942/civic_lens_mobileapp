import { Globe, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/TranslationContext";

const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
];

const LanguageSelector = () => {
    const { language: currentLang, setLanguage } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full bg-white/40 hover:bg-white/50 backdrop-blur-md border border-white/40 text-white shrink-0 shadow-sm flex-none">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl border-border shadow-xl backdrop-blur-xl bg-card/95">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code as any)}
                        className={`flex items-center justify-between cursor-pointer py-3 px-4 rounded-xl mb-1 last:mb-0 ${currentLang === lang.code ? "bg-primary/10 text-primary" : ""
                            }`}
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{lang.native}</span>
                            <span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">{lang.name}</span>
                        </div>
                        {currentLang === lang.code && <Check className="h-4 w-4 stroke-[3px]" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSelector;
