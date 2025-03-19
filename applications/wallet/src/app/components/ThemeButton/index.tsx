import { Icon } from '@proton/components';
import useFlag from '@proton/unleash/useFlag';
import { themeChange, useWalletDispatch } from '@proton/wallet/store';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { CoreButton } from '../../atoms';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';

const ThemeButton = () => {
    const dispatch = useWalletDispatch();
    const theme = useWalletTheme();

    const hasDarkMode = useFlag('WalletDarkMode');
    if (!hasDarkMode) {
        return <></>;
    }

    return (
        <CoreButton
            icon
            pill
            size="medium"
            shape="ghost"
            color="weak"
            className="ml-2 bg-weak shrink-0"
            onClick={() => {
                if (theme === WalletThemeOption.WalletDark) {
                    dispatch(themeChange({ theme: WalletThemeOption.WalletLight }));
                } else {
                    dispatch(themeChange({ theme: WalletThemeOption.WalletDark }));
                }
            }}
        >
            <Icon name={theme === WalletThemeOption.WalletDark ? 'sun' : 'moon'} size={5} />
        </CoreButton>
    );
};

export default ThemeButton;
