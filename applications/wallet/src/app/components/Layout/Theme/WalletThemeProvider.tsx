import { type FC, type PropsWithChildren, createContext, useContext, useLayoutEffect, useState } from 'react';

import useFlag from '@proton/unleash/useFlag';
import { useSettings } from '@proton/wallet/store/hooks/useLocalSettings';
import { WalletThemeOption, getWalletDefaultTheme } from '@proton/wallet/utils/theme';

// @ts-ignore
import walletDarkTheme from '@proton/colors/themes/dist/wallet-dark.theme.css';
// @ts-ignore
import walletLightTheme from '@proton/colors/themes/dist/wallet-light.theme.css';

export const THEME_ID = 'wallet-theme';

type ThemeConfig = { className: string; styles: string };

const getThemeConfig = (theme: WalletThemeOption): ThemeConfig => {
    switch (theme) {
        case WalletThemeOption.WalletLight:
            return { className: 'wallet-light', styles: walletLightTheme.toString() };
        case WalletThemeOption.WalletDark:
            return { className: 'wallet-dark', styles: walletDarkTheme.toString() };
    }
};

export const WalletThemeContext = createContext<WalletThemeOption>(getWalletDefaultTheme());

export const WalletThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasDarkMode = useFlag('WalletDarkMode');

    const [settings] = useSettings();
    const walletTheme = hasDarkMode ? (settings?.theme ?? getWalletDefaultTheme()) : WalletThemeOption.WalletLight;
    const [config, setConfig] = useState<ThemeConfig>(getThemeConfig(walletTheme));

    useLayoutEffect(() => {
        setConfig(getThemeConfig(walletTheme));
    }, [settings]);

    useLayoutEffect(() => {
        document.body.classList.add(config.className);
        return () => document.body.classList.remove(config.className);
    }, [config]);

    return (
        <WalletThemeContext.Provider value={walletTheme}>
            <style id={THEME_ID}>{config.styles}</style>
            {children}
        </WalletThemeContext.Provider>
    );
};

export const useWalletTheme = () => useContext(WalletThemeContext);
