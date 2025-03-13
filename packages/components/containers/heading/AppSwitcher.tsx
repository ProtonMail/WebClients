import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import Logo from '@proton/components/components/logo/Logo';
import ProductLink from '@proton/components/containers/app/ProductLink';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useConfig from '@proton/components/hooks/useConfig';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

export const AppSwitcher = ({ hasBorder, app }: { hasBorder?: boolean; app: APP_NAMES }) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [organization] = useOrganization();

    const isLumoAvailable = useFlag('LumoInProductSwitcher');
    const isAccessControlEnabled = useFlag('AccessControl');

    if (viewportWidth['<=small']) {
        const availableApps = getAvailableApps({
            user,
            context: 'dropdown',
            organization,
            isLumoAvailable,
            isAccessControlEnabled,
        });
        if (availableApps.length <= 1) {
            return null;
        }
        return (
            <ul className={clsx('mx-4 mb-4 unstyled text-sm', hasBorder && 'border-top border-weak')}>
                {availableApps.map((appToLinkTo) => {
                    const appToLinkToName = getAppShortName(appToLinkTo);
                    const current = app && appToLinkTo === app;

                    return (
                        <li key={appToLinkTo}>
                            <ProductLink
                                ownerApp={APP_NAME}
                                app={app}
                                appToLinkTo={appToLinkTo}
                                user={user}
                                className="flex flex-nowrap items-center color-weak text-no-decoration border-weak border-bottom interactive-pseudo relative py-1"
                            >
                                <Logo appName={appToLinkTo} variant="glyph-only" className="shrink-0 mr-2" />
                                <span className={clsx(current && 'color-norm text-semibold')} aria-hidden>
                                    {appToLinkToName}
                                </span>
                            </ProductLink>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return null;
};
