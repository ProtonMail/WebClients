import type { ForwardedRef } from 'react';
import { Fragment, forwardRef } from 'react';

import { c } from 'ttag';

import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import type { AppLinkProps } from '@proton/components/components/link/AppLink';
import { useConfig, useUser } from '@proton/components/hooks';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { isElectronMail, isElectronOnInboxApps, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import { InboxDesktopAppSwitcher } from '../desktop';
import ProductIcon from './ProductIcon';
import ProductLink from './ProductLink';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
    app?: APP_NAMES;
    user?: UserModel;
    title?: string;
    reloadDocument?: AppLinkProps['reloadDocument'];
}

const AppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    (
        { onDropdownClick, app, user, title, reloadDocument, ...rest }: AppsDropdownProps,
        ref: ForwardedRef<HTMLButtonElement>
    ) => {
        const { APP_NAME } = useConfig();

        const availableApps = getAvailableApps({ user, context: 'dropdown' });

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
                title={title ? title : c('Apps dropdown').t`${BRAND_NAME} applications`}
                onClick={onDropdownClick}
                disableDefaultArrowNavigation
                {...rest}
                ref={ref}
                as="button"
            >
                <ul className="unstyled my-0 p-4" style={{ '--apps-dropdown-repeat': isElectronMail ? '2' : '3' }}>
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

export const UnAuthenticatedAppsDropdown = AppsDropdown;

const AuthenticatedAppsDropdown = forwardRef<HTMLButtonElement, AppsDropdownProps>(
    (props: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
        const [user] = useUser();
        const { APP_NAME } = useConfig();
        const isInboxCustomAppSwitcher = useFlag('InboxDesktopWinLinNewAppSwitcher');

        // The app swicher on Mail, Calendar and account desktop application is different
        if (isElectronOnInboxApps(APP_NAME) && (isElectronOnMac || (isInboxCustomAppSwitcher && isElectronMail))) {
            return <InboxDesktopAppSwitcher appToLinkTo={props.app} />;
        }

        return <AppsDropdown ref={ref} {...props} user={user} />;
    }
);

export default AuthenticatedAppsDropdown;
