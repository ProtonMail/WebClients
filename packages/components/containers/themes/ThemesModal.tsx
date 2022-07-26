import { c } from 'ttag';

import { updateThemeType } from '@proton/shared/lib/api/settings';
import { getAppFromHostname } from '@proton/shared/lib/apps/slugHelper';
import { postMessageToIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';

import { ThemeCards, useTheme } from '.';
import { Button, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useSideApp } from '../../hooks';

const ThemesModal = (props: ModalProps) => {
    const api = useApi();
    const [theme, setTheme] = useTheme();
    const { sideAppUrl } = useSideApp();

    const handleThemeChange = async (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        await api(updateThemeType(newThemeType));

        // If the side panel is open, we need to make the app inside the iframe to call the event manager
        // Otherwise, the theme is not updated before the next event manager call
        if (sideAppUrl) {
            const sideApp = getAppFromHostname(new URL(sideAppUrl).hostname);
            if (sideApp) {
                postMessageToIframe(
                    { type: SIDE_APP_EVENTS.SIDE_APP_UPDATE_THEME, payload: { theme: newThemeType } },
                    sideApp
                );
            }
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
