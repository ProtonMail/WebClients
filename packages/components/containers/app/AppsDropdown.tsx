import { ForwardedRef, Fragment, forwardRef } from 'react';

import { c } from 'ttag';

import { useConfig, useUser } from '@proton/components/hooks';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { isElectronApp, isElectronOnInboxApps, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import { UserModel } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Icon, Logo, SimpleDropdown } from '../../components';
import { InboxDesktopAppSwitcher } from '../desktop';
import ProductLink from './ProductLink';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
    app?: APP_NAMES;
    user?: UserModel;
}

const AppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    ({ onDropdownClick, app, user, ...rest }: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
        const { APP_NAME } = useConfig();

        const availableApps = getAvailableApps(user);

        if (availableApps.length <= 1) {
            return null;
        }

        return (
            <SimpleDropdown
                type="button"
                hasCaret={false}
                content={<Icon name="app-switch" size={6} className="apps-dropdown-button-icon shrink-0 no-print" />}
                className="apps-dropdown-button shrink-0"
                dropdownClassName="apps-dropdown rounded-lg"
                originalPlacement="bottom-start"
                title={c('Apps dropdown').t`${BRAND_NAME} applications`}
                onClick={onDropdownClick}
                disableDefaultArrowNavigation
                {...rest}
                ref={ref}
                as="button"
            >
                <ul className="unstyled my-0 p-4" style={{ '--apps-dropdown-repeat': isElectronApp ? '2' : '3' }}>
                    {availableApps.map((appToLinkTo) => {
                        const appToLinkToName = getAppShortName(appToLinkTo);
                        const current = app && appToLinkTo === app;

                        return (
                            <Fragment key={appToLinkTo}>
                                <li className="dropdown-item apps-dropdown-item" data-testid="apps-dropdown-item">
                                    <ProductLink
                                        ownerApp={APP_NAME}
                                        app={app}
                                        user={user}
                                        appToLinkTo={appToLinkTo}
                                        className="text-center text-no-decoration outline-none--at-all apps-dropdown-link"
                                        current={current}
                                    >
                                        <div
                                            className="apps-dropdown-logo-wrapper flex items-center justify-center rounded-lg border border-weak w-custom h-custom mx-auto"
                                            style={{ '--w-custom': '3.25rem', '--h-custom': '3.25rem' }}
                                        >
                                            <Logo
                                                appName={appToLinkTo}
                                                variant="glyph-only"
                                                className="shrink-0"
                                                size={9}
                                            />
                                        </div>
                                        <span
                                            className={clsx(
                                                'block text-center text-sm mt-1 apps-dropdown-app-name',
                                                current ? 'color-norm text-semibold' : 'color-weak'
                                            )}
                                            aria-hidden
                                        >
                                            {appToLinkToName}
                                        </span>
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

export const UnAuthenticatedAppsDropdown = AppsDropdown;

const AuthenticatedAppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    (props: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
        const [user] = useUser();
        const { APP_NAME } = useConfig();

        // The app swicher on Mail, Calendar and account desktop application is different
        if (isElectronOnInboxApps(APP_NAME) && isElectronOnMac) {
            return <InboxDesktopAppSwitcher appToLinkTo={props.app} />;
        }

        return <AppsDropdown ref={ref} {...props} user={user} />;
    }
);

export default AuthenticatedAppsDropdown;
