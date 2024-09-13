import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { getMeterColor } from '@proton/components/components/progress/Meter';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import {
    isElectronMail,
    isElectronOnLinux,
    isElectronOnMac,
    isElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { getAppSpace, getCanAddStorage, getSpace } from '@proton/shared/lib/user/storage';
import clsx from '@proton/utils/clsx';
import percentage from '@proton/utils/percentage';

import UserDropdown from '../../containers/heading/UserDropdown';
import { useActiveBreakpoint, useConfig, useSubscription, useUser } from '../../hooks';
import { useFocusTrap } from '../focus';
import { SettingsLink } from '../link';
import { Tooltip } from '../tooltip';
import Hamburger from './Hamburger';
import SidebarStorageMeter from './SidebarStorageMeter';

const Storage = ({
    appSpace,
    app,
    user,
    subscription,
    version,
}: {
    appSpace: ReturnType<typeof getAppSpace>;
    app: APP_NAMES;
    user: UserModel;
    subscription?: Subscription;
    version?: ReactNode;
}) => {
    const spacePercentage = percentage(appSpace.maxSpace, appSpace.usedSpace);
    const spacePercentagePrecision = Math.ceil(spacePercentage * 10000) / 10000;

    const canAddStorage = getCanAddStorage({ user, subscription });

    const upsellRef = getUpsellRefFromApp({
        app,
        feature: SHARED_UPSELL_PATHS.STORAGE,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    const humanUsedSpace = humanSize({ bytes: appSpace.usedSpace });
    const humanMaxSpace = humanSize({ bytes: appSpace.maxSpace });

    const storageText = (
        <>
            <span
                className={clsx(['used-space text-bold', `color-${getMeterColor(spacePercentagePrecision)}`])}
                style={{ '--signal-success': 'initial' }}
                // Used by Drive E2E tests
                data-testid="app-used-space"
            >
                {humanUsedSpace}
            </span>
            &nbsp;/&nbsp;<span className="max-space">{humanMaxSpace}</span>
        </>
    );

    return (
        <>
            <SidebarStorageMeter
                label={`${c('Storage').t`Your current storage:`} ${humanUsedSpace} / ${humanMaxSpace}`}
                value={spacePercentagePrecision}
            />
            <div className="flex flex-nowrap justify-space-between py-2">
                <span>
                    {canAddStorage ? (
                        <Tooltip title={c('Storage').t`Upgrade storage`}>
                            <SettingsLink
                                path={addUpsellPath(getUpgradePath({ user, subscription }), upsellRef)}
                                className="app-infos-storage text-no-decoration text-xs m-0"
                            >
                                {storageText}
                            </SettingsLink>
                        </Tooltip>
                    ) : (
                        <span className="app-infos-storage text-xs m-0">{storageText}</span>
                    )}
                </span>
                <span className="app-infos-compact">{version}</span>
            </div>
        </>
    );
};

interface Props extends ComponentPropsWithoutRef<'div'> {
    app: APP_NAMES;
    logo?: ReactNode;
    /**
     * Expanded is only for mobile
     */
    expanded?: boolean;
    onToggleExpand?: () => void;
    primary?: ReactNode;
    children?: ReactNode;
    version?: ReactNode;
    hasAppLinks?: boolean;
    appsDropdown: ReactNode | null;
    /**
     * Extra content that will be rendered below the storage meter and version.
     */
    preFooter?: ReactNode;
    postFooter?: ReactNode;
    /**
     * If `true`, the sidebar children container will grow to the maximum
     * available size.
     *
     * This is the default behavior, set this to `false` if you want the footer
     * to stick to the content.
     *
     * @default true
     */
    growContent?: boolean;
    showStorage?: boolean;
    /**
     * Only when collapse button is present
     */
    collapsed?: boolean;
    navigationRef?: Ref<HTMLDivElement>;
}

const Sidebar = ({
    app,
    expanded = false,
    appsDropdown,
    onToggleExpand,
    hasAppLinks = true,
    logo,
    primary,
    children,
    version,
    preFooter,
    postFooter,
    growContent = true,
    showStorage = true,
    collapsed = false,
    className,
    navigationRef,
    ...rest
}: Props) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const focusTrapProps = useFocusTrap({
        active: expanded,
        rootRef,
    });
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const appSpace = getAppSpace(getSpace(user), app);
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <div
                ref={rootRef}
                className={clsx(
                    'sidebar flex flex-nowrap flex-column no-print outline-none',
                    collapsed && 'sidebar--collapsed',
                    className
                )}
                data-expanded={expanded}
                {...rest}
                {...focusTrapProps}
            >
                <Hamburger
                    expanded={expanded}
                    onToggle={onToggleExpand}
                    className="md:hidden shrink-0 absolute right-0 mr-5 mt-2 opacity-0 focus:opacity-100 bg-norm"
                />

                <h1 className="sr-only">{getAppName(APP_NAME)}</h1>

                {!isElectronMail && (
                    <div
                        className={clsx(
                            'logo-container hidden md:flex shrink-0 justify-space-between items-center flex-nowrap gap-0.5',
                            collapsed && 'self-center border-bottom mb-3'
                        )}
                    >
                        {logo}

                        <div
                            className={clsx('hidden md:block w-custom h-custom grow-0 shrink-0', collapsed && 'my-2')}
                            style={{ '--w-custom': '2.25rem', '--h-custom': '2.25rem' }}
                        >
                            {appsDropdown}
                        </div>
                    </div>
                )}

                {isElectronOnMac && (
                    <div className="flex flex-column">
                        <div className="sidebar-header flex justify-end px-4 py-3 z-1">{appsDropdown}</div>
                        {primary && <div className="px-4 pb-2">{primary}</div>}
                    </div>
                )}

                {(isElectronOnWindows || isElectronOnLinux) && (
                    <div className="sidebar-header flex flex-nowrap gap-4 items-center justify-between my-3 px-3">
                        {primary && <div className="shrink-0 flex-1 hidden md:block">{primary}</div>}
                        <div className="shrink-0">{appsDropdown}</div>
                    </div>
                )}

                {viewportWidth['<=small'] && (
                    <div className="px-3 shrink-0 md:hidden">
                        <UserDropdown app={APP_NAME} hasAppLinks={hasAppLinks} />
                    </div>
                )}

                {primary && !isElectronMail ? (
                    <div className="px-3 pb-2 shrink-0 hidden md:block">{primary}</div>
                ) : null}
                <div className="mt-1 md:mt-0" aria-hidden="true" />
                <div
                    className={clsx(
                        growContent ? 'flex-1' : 'grow-0',
                        'flex-nowrap flex flex-column pb-2 md:mt-2',
                        !collapsed && 'overflow-overlay'
                    )}
                    tabIndex={-1}
                    ref={navigationRef}
                >
                    {children}
                </div>
                {showStorage &&
                app !== APPS.PROTONVPN_SETTINGS &&
                APP_NAME !== APPS.PROTONVPN_SETTINGS &&
                appSpace.maxSpace > 0 ? (
                    <div className="shrink-0 app-infos px-3 mt-2">
                        {preFooter}
                        <Storage
                            appSpace={appSpace}
                            app={app}
                            user={user}
                            subscription={subscription}
                            version={version}
                        />
                        {postFooter}
                    </div>
                ) : (
                    <div className={clsx('border-top', collapsed && 'hidden')}>
                        <div className="text-center py-2 px-3">{version}</div>
                    </div>
                )}
            </div>
            {
                // mobile backdrop
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                expanded ? <div className="sidebar-backdrop" onClick={onToggleExpand}></div> : undefined
            }
        </>
    );
};

export default Sidebar;
