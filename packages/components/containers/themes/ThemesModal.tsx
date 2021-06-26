import React from 'react';
import { c } from 'ttag';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { updateThemeType } from '@proton/shared/lib/api/settings';

import { FormModal } from '../../components';
import { useApi } from '../../hooks';
import { ThemeCards, useTheme } from '.';

const availableThemes = Object.values(PROTON_THEMES);

const ThemesModal = (props: { onClose?: () => void }) => {
    const api = useApi();
    const [theme, setTheme] = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        api(updateThemeType(newThemeType));
    };

    const handleSubmit = () => {
        props.onClose?.();
    };

    const themes = availableThemes.map(({ identifier, getI18NLabel, src }) => {
        return { identifier, label: getI18NLabel(), src };
    });

    return (
        <FormModal {...props} intermediate close={null} submit={c('Action').t`OK`} onSubmit={handleSubmit}>
            <div className="h2 text-center mb1">{c('Title').t`Select a theme`}</div>
            <div className="flex">
                <ThemeCards
                    className="theme-modal-list"
                    list={themes}
                    themeIdentifier={theme}
                    onChange={handleThemeChange}
                />
            </div>
        </FormModal>
    );
};

export default ThemesModal;
