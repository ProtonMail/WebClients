import { c } from 'ttag';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { updateThemeType } from '@proton/shared/lib/api/settings';

import { FormModal } from '../../components';
import { useApi } from '../../hooks';
import { ThemeCards, useTheme } from '.';

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

    return (
        <FormModal {...props} intermediate close={null} submit={c('Action').t`OK`} onSubmit={handleSubmit}>
            <div className="h2 text-center mb1">{c('Title').t`Select a theme`}</div>
            <div className="flex">
                <ThemeCards
                    className="theme-modal-list"
                    list={PROTON_THEMES}
                    themeIdentifier={theme}
                    onChange={handleThemeChange}
                />
            </div>
        </FormModal>
    );
};

export default ThemesModal;
