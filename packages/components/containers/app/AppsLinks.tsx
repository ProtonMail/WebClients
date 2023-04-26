import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import { AppLink, Logo, SettingsLink } from '../../components';
import { useConfig, useFeature, useUser } from '../../hooks';
import { FeatureCode } from '../features';

interface AppsProps {
    app: APP_NAMES;
    name?: boolean;
    itemClassName?: string;
    currentItem?: boolean;
}

const AppsLinks: any = ({ app: currentApp, name, itemClassName, currentItem }: AppsProps) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();

    const passSettingsFeature = useFeature<boolean>(FeatureCode.PassSettings);
    const isPassSettingsEnabled = passSettingsFeature.feature?.Value === true;

    const apps = [
        APPS.PROTONMAIL,
        APPS.PROTONCALENDAR,
        APPS.PROTONDRIVE,
        APPS.PROTONVPN_SETTINGS,
        isPassSettingsEnabled ? APPS.PROTONPASS : undefined,
    ].filter(isTruthy);

    return apps.map((app) => {
        const appName = getAppName(app);
        const inner = (
            <>
                <Logo appName={app} variant="glyph-only" className="flex-item-noshrink mr-2" />
                {name && appName}
            </>
        );
        const current = currentItem && currentApp === app;
        if (getRequiresAddressSetup(app, user)) {
            const params = new URLSearchParams();
            params.set('to', app);
            params.set('from', currentApp);
            if (APP_NAME === APPS.PROTONACCOUNT) {
                params.set('type', 'settings');
            }
            return (
                <AppLink
                    key={app}
                    to={`${SETUP_ADDRESS_PATH}?${params.toString()}`}
                    toApp={APPS.PROTONACCOUNT}
                    title={appName}
                    className={itemClassName}
                    aria-current={current}
                >
                    {inner}
                </AppLink>
            );
        }
        if (app === APPS.PROTONVPN_SETTINGS) {
            return (
                <SettingsLink
                    path="/"
                    app={app}
                    key={app}
                    title={appName}
                    className={itemClassName}
                    aria-current={current}
                >
                    {inner}
                </SettingsLink>
            );
        }
        if (app === APPS.PROTONPASS) {
            return (
                <SettingsLink
                    path="/"
                    app={app}
                    key={app}
                    title={appName}
                    className={itemClassName}
                    aria-current={current}
                >
                    {inner}
                </SettingsLink>
            );
        }
        return (
            <AppLink key={app} to="/" toApp={app} title={appName} className={itemClassName} aria-current={current}>
                {inner}
            </AppLink>
        );
    });
};

export default AppsLinks;
