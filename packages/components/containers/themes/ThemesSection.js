import React from 'react';
import { c } from 'ttag';
import {
    useMailSettings,
    useEventManager,
    useApi,
    useLoading,
    Alert,
    ThemeCards,
    useModals,
    useNotifications,
    ConfirmModal
} from 'react-components';
import { updateTheme } from 'proton-shared/lib/api/mailSettings';
import {
    getThemeIdentifier,
    isCustomTheme,
    isCustomThemeIdentifier,
    stripThemeIdentifier
} from 'proton-shared/lib/themes/helpers';
import { DEFAULT_THEME, CUSTOM_THEME, PROTON_THEMES } from 'proton-shared/lib/themes/themes.js';

import CustomThemeModal from './CustomThemeModal.js';

const availableThemes = [DEFAULT_THEME, PROTON_THEMES.DARK, CUSTOM_THEME];

const ThemesSection = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [{ Theme }] = useMailSettings();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const hasCustomTheme = isCustomTheme(Theme);
    const customCSS = hasCustomTheme ? Theme : '';

    const themes = availableThemes.map(({ identifier, getI18NLabel, src, customizable }) => {
        const id = stripThemeIdentifier(identifier);
        return { identifier, id, label: getI18NLabel(), alt: id, src, customizable };
    });

    const handleSaveCustomTheme = async (customCSSInput) => {
        await api(updateTheme(customCSSInput));
        await call();
        createNotification({ text: c('Success').t`Custom mode saved` });
    };

    const handleOpenModal = () => {
        createModal(<CustomThemeModal theme={customCSS} onSave={handleSaveCustomTheme} />);
    };

    const handleChangeTheme = async (newThemeIdentifier) => {
        if (hasCustomTheme) {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        submit={c('Action').t`Apply`}
                        title={c('Title').t`Change mode`}
                        onConfirm={resolve}
                        onClose={reject}
                    >
                        <Alert type="warning">{c('Warning')
                            .t`This action will erase your current custom mode. Are you sure you want to apply this new mode?`}</Alert>
                    </ConfirmModal>
                );
            });
        }
        if (isCustomThemeIdentifier(newThemeIdentifier)) {
            return handleOpenModal();
        }
        await api(updateTheme(newThemeIdentifier));
        await call();
        createNotification({ text: c('Success').t`Theme saved` });
    };

    return (
        <>
            <Alert>{c('Info').t`Choose the look and feel of your mailbox.`}</Alert>
            <Alert type="warning">{c('Info')
                .t`Selecting another mode will override your current mode and any customization will be lost.`}</Alert>
            <ThemeCards
                list={themes}
                themeIdentifier={getThemeIdentifier(Theme)}
                onChange={(identifier) => withLoading(handleChangeTheme(identifier))}
                onCustomization={handleOpenModal}
                disabled={loading}
            />
        </>
    );
};

export default ThemesSection;
