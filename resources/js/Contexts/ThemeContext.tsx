import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { ConfigProvider, theme as antTheme } from "antd";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Landeseiten.de Brand Colors
const brandColors = {
    primary: "#6c1e9f", // Purple from landeseiten.de
    primaryLight: "#b151f0", // Light purple variant
    primaryDark: "#440c71", // Dark purple variant
    secondary: "#e46a28", // Orange accent
    success: "#52b37c", // Green for success states
    navyBlue: "#255995", // Navy blue for navigation
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem("theme");
        return (stored as Theme) || "light";
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ConfigProvider
                theme={{
                    algorithm:
                        theme === "dark"
                            ? antTheme.darkAlgorithm
                            : antTheme.defaultAlgorithm,
                    token: {
                        // Brand Colors
                        colorPrimary: brandColors.primary,
                        colorSuccess: brandColors.success,
                        colorWarning: brandColors.secondary,
                        colorInfo: brandColors.navyBlue,

                        // Typography
                        fontFamily:
                            '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        fontSize: 16,
                        fontSizeHeading1: 32,
                        fontSizeHeading2: 28,
                        fontSizeHeading3: 24,
                        fontSizeHeading4: 20,
                        fontSizeHeading5: 18,

                        // Border Radius (Rounded style from landeseiten.de)
                        borderRadius: 10,
                        borderRadiusLG: 12,
                        borderRadiusSM: 8,

                        // Spacing
                        padding: 16,
                        margin: 16,

                        // Line Heights
                        lineHeight: 1.6,
                    },
                    components: {
                        Button: {
                            borderRadius: 10,
                            controlHeight: 40,
                            fontWeight: 700,
                            algorithm: true, // Enable gradient backgrounds in dark mode
                        },
                        Card: {
                            borderRadiusLG: 12,
                        },
                        Input: {
                            borderRadius: 10,
                            controlHeight: 40,
                        },
                        Select: {
                            borderRadius: 10,
                            controlHeight: 40,
                        },
                        Table: {
                            borderRadiusLG: 12,
                        },
                        Modal: {
                            borderRadiusLG: 12,
                        },
                        Menu: {
                            darkItemBg: "#001529",
                            darkItemSelectedBg: brandColors.primary,
                            darkItemHoverBg: brandColors.primaryDark,
                        },
                        Layout: {
                            siderBg: theme === "dark" ? "#001529" : "#001529",
                            triggerBg: theme === "dark" ? "#002140" : "#002140",
                        },
                    },
                }}
            >
                {children}
            </ConfigProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
