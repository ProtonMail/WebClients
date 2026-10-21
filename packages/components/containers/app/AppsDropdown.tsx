import type { ForwardedRef } from 'react';
import { Fragment, forwardRef } from 'react';

import { c } from 'ttag';

import { unauthenticatedApps } from '@proton/account/availableApps/apps';
import { useAvailableApps } from '@proton/account/availableApps/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { IcAppSwitch } from '@proton/icons/icons/IcAppSwitch';
import { TelemetryAppSwitcher, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { isPassUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import type { AppLinkProps } from '../../components/link/AppLink';
import { InboxDesktopAppSwitcher } from '../desktop/InboxDesktopAppSwitcher';
import ProductIcon from './ProductIcon';
import ProductLink from './ProductLink';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
    app?: APP_NAMES;
    user?: UserModel;
    title?: string;
    reloadDocument?: AppLinkProps['reloadDocument'];
    onAppClick?: (appToLinkTo: APP_NAMES) => void;
}

type AppsDropdownListProps = AppsDropdownProps & { availableApps: APP_NAMES[] };

const AppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownListProps>(
    (
        {
            onDropdownClick,
            app,
            user,
            title,
            reloadDocument,
            onAppClick,
            availableApps,
            ...rest
        }: AppsDropdownListProps,
        ref: ForwardedRef<HTMLButtonElement>
    ) => {
        const { APP_NAME } = useConfig();

        if (availableApps.length <= 1) {
            return null;
        }

        return (
            <SimpleDropdown
                type="button"
                hasCaret={false}
                content={<IcAppSwitch size={6} className="apps-dropdown-button-icon shrink-0 no-print" />}
                className="apps-dropdown-button shrink-0"
                dropdownClassName="apps-dropdown rounded-lg"
                originalPlacement="bottom-start"
                title={title ? title : c('Apps dropdown').t`${BRAND_NAME} applications`}
                onClick={onDropdownClick}
                disableDefaultArrowNavigation
                {...rest}
                ref={ref}
                as="button"
            >
                <ul
                    className="unstyled my-0 p-4"
                    style={{ '--apps-dropdown-repeat': isElectronMail || availableApps.length <= 2 ? '2' : '3' }}
                >
                    {availableApps.map((appToLinkTo) => {
                        const current = app && appToLinkTo === app;

                        return (
                            <Fragment key={appToLinkTo}>
                                <li className="dropdown-item apps-dropdown-item" data-testid="apps-dropdown-item">
                                    <ProductLink
                                        ownerApp={APP_NAME}
                                        app={app}
                                        user={user}
                                        appToLinkTo={appToLinkTo}
                                        className="text-center text-no-decoration outline-none--at-all apps-dropdown-link flex flex-column items-center"
                                        current={current}
                                        reloadDocument={reloadDocument}
                                        // The same app opens in the same window, other apps in new windows
                                        target={APP_NAME === appToLinkTo ? '_self' : '_blank'}
                                        onAppClick={() => onAppClick?.(appToLinkTo)}
                                    >
                                        <ProductIcon appToLinkTo={appToLinkTo} current={current} />
                                    </ProductLink>
                                </li>
                            </Fragment>
                        );
                    })}
                </ul>
            </SimpleDropdown>
        );
    }
);

AppsDropdown.displayName = 'AppsDropdown';

export const UnAuthenticatedAppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    (props: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => (
        <AppsDropdown ref={ref} {...props} availableApps={unauthenticatedApps} />
    )
);

UnAuthenticatedAppsDropdown.displayName = 'UnAuthenticatedAppsDropdown';

const AuthenticatedAppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    (props: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
        const [user] = useUser();
        const availableApps = useAvailableApps();
        const { APP_NAME } = useConfig();
        const api = useApi();
        const [userSettings] = useUserSettings();

        const handleAppClick = (toApp: APP_NAMES) => {
            try {
                const { UsedClientFlags } = userSettings;
                if (!UsedClientFlags) {
                    return;
                }

                if (toApp === APPS.PROTONPASS) {
                    const alreadyUsedPass = isPassUser(BigInt(UsedClientFlags));

                    void sendTelemetryReport({
                        api,
                        measurementGroup: TelemetryMeasurementGroups.appSwitcher,
                        event: TelemetryAppSwitcher.dropdown_app_click,
                        dimensions: {
                            fromApp: APP_NAME,
                            toApp: toApp,
                            alreadyUsedApp: alreadyUsedPass.toString(),
                        },
                        delay: false,
                    });
                }
            } catch {}
        };

        // The desktop Mail app (Mail, Calendar, Account) has its own app switcher
        if (isElectronMail) {
            return <InboxDesktopAppSwitcher appToLinkTo={props.app} />;
        }

        return (
            <AppsDropdown ref={ref} {...props} user={user} availableApps={availableApps} onAppClick={handleAppClick} />
        );
    }
);

AuthenticatedAppsDropdown.displayName = 'AuthenticatedAppsDropdown';

export default AuthenticatedAppsDropdown;
