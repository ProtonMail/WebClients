import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { updateThemeType } from '@proton/shared/lib/api/settings';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';

import { ThemeCards, useTheme } from '.';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useDrawer } from '../../hooks';

const ThemesModal = (props: ModalProps) => {
    const api = useApi();
    const [theme, setTheme] = useTheme();
    const { iframeSrcMap } = useDrawer();

    const handleThemeChange = async (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        await api(updateThemeType(newThemeType));

        // If the drawer is open, we need to make the app inside the iframe to call the event manager
        // Otherwise, the theme is not updated before the next event manager call
        if (iframeSrcMap) {
            Object.keys(iframeSrcMap).map((app) => {
                postMessageToIframe(
                    { type: DRAWER_EVENTS.UPDATE_THEME, payload: { theme: newThemeType } },
                    app as DRAWER_APPS
                );
            });
        }
    };

    return (
        <ModalTwo size="large" {...props}>
            <ModalTwoHeader title={c('Title').t`Select a theme`} />
            <ModalTwoContent>
                <ThemeCards
                    className="theme-modal-list"
                    list={PROTON_THEMES}
                    size="small"
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
