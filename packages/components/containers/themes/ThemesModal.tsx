import { c } from 'ttag';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { updateThemeType } from '@proton/shared/lib/api/settings';

import { ModalTwo, ModalTwoHeader, ModalTwoContent, ModalTwoFooter, Button, ModalProps } from '../../components';
import { useApi } from '../../hooks';
import { ThemeCards, useTheme } from '.';

const ThemesModal = (props: ModalProps) => {
    const api = useApi();
    const [theme, setTheme] = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        void api(updateThemeType(newThemeType));
    };

    return (
        <ModalTwo size="large" {...props}>
            <ModalTwoHeader title={c('Title').t`Select a theme`} />
            <ModalTwoContent>
                <ThemeCards
                    className="theme-modal-list"
                    list={PROTON_THEMES}
                    themeIdentifier={theme}
                    onChange={handleThemeChange}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" className="mlauto" onClick={props.onClose}>{c('Action').t`OK`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ThemesModal;
