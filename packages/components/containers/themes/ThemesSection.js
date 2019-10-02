import React from 'react';
import { c } from 'ttag';
import {
    useMailSettings,
    useEventManager,
    useApi,
    useLoading,
    SubTitle,
    Alert,
    ThemeCards,
    useModals,
    useNotifications
} from 'react-components';
import { updateTheme } from 'proton-shared/lib/api/mailSettings';
import { getThemeIdentifier, stripThemeIdentifier } from 'proton-shared/lib/themes/helpers';
import { DEFAULT_THEME, CUSTOM_THEME } from 'proton-shared/lib/themes/themes.js';

import CustomThemeModal from './CustomThemeModal.js';

const availableThemes = [DEFAULT_THEME, CUSTOM_THEME];

const ThemesSection = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [{ Theme }] = useMailSettings();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const themeIdentifier = getThemeIdentifier(Theme);
    const customCSS = themeIdentifier === CUSTOM_THEME.identifier ? Theme : '';

    const themes = availableThemes.map(({ identifier, getI18NLabel, src, customizable }) => {
        const id = stripThemeIdentifier(identifier);
        return { identifier, id, label: getI18NLabel(), alt: id, src, customizable };
    });

    const handleChangeTheme = async (themeIdentifier) => {
        if (themeIdentifier === CUSTOM_THEME.identifier) {
            return handleOpenModal();
        }
        await api(updateTheme(themeIdentifier));
        await call();
        createNotification({ text: c('Success').t`Theme saved` });
    };

    const handleSaveCustomTheme = async (customCSSInput) => {
        await api(updateTheme(customCSSInput));
        await call();
        createNotification({ text: c('Success').t`Custom theme saved` });
    };

    const handleOpenModal = () => {
        createModal(<CustomThemeModal theme={customCSS} onSave={handleSaveCustomTheme} />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Themes`}</SubTitle>
            <Alert>{c('Info').t`Choose the look and feel of your mailbox.`}</Alert>
            <Alert type="warning">{c('Info')
                .t`Selecting another theme will override your current theme and any customization will be lost.`}</Alert>
            <ThemeCards
                list={themes}
                themeIdentifier={themeIdentifier}
                onChange={(identifier) => withLoading(handleChangeTheme(identifier))}
                onCustomization={handleOpenModal}
                disabled={loading}
            />
        </>
    );
};

export default ThemesSection;
