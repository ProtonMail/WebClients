import { ComponentPropsWithoutRef, ReactNode, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { hasMailProfessional, hasNewVisionary, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import clsx from '@proton/utils/clsx';
import percentage from '@proton/utils/percentage';

import { useConfig, useSubscription, useUser } from '../../hooks';
import { useFocusTrap } from '../focus';
import { SettingsLink } from '../link';
import { getMeterColor } from '../progress';
import { Tooltip } from '../tooltip';
import Hamburger from './Hamburger';
import MobileAppsLinks from './MobileAppsLinks';
import SidebarStorageMeter from './SidebarStorageMeter';

interface Props extends ComponentPropsWithoutRef<'div'> {
    app?: APP_NAMES;
    logo?: ReactNode;
    expanded?: boolean;
    onToggleExpand?: () => void;
    primary?: ReactNode;
    children?: ReactNode;
    version?: ReactNode;
    storageGift?: ReactNode;
    hasAppLinks?: boolean;
    appsDropdown: ReactNode;
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
    storageGift,
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
    const { UsedSpace, MaxSpace, isMember, isSubUser } = user;
    const spacePercentage = percentage(MaxSpace, UsedSpace);

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    const canAddStorage = useMemo(() => {
        if (!subscription) {
            return false;
        }
        if (isSubUser) {
            return false;
        }
        if (isMember) {
            return false;
        }
        if (hasNewVisionary(subscription) || hasVisionary(subscription) || hasMailProfessional(subscription)) {
            return false;
        }
        return true;
    }, [subscription, user]);

    const storageText = (
        <>
            <span
                className={clsx(['used-space text-bold', `color-${getMeterColor(spacePercentage)}`])}
                style={{ '--signal-success': 'initial' }}
            >
                {humanSize(UsedSpace)}
            </span>
            &nbsp;/&nbsp;<span className="max-space">{humanSize(MaxSpace)}</span>
        </>
    );

    return (
        <>
            <div
                ref={rootRef}
                className="sidebar flex flex-nowrap flex-column no-print outline-none"
                data-expanded={expanded}
                {...rest}
                {...focusTrapProps}
            >
                <h1 className="sr-only">{getAppName(APP_NAME)}</h1>
                <div className="logo-container flex flex-justify-space-between flex-align-items-center flex-nowrap">
                    {logo}
                    <div className="no-mobile">{appsDropdown}</div>
                    <div className="no-desktop no-tablet flex-item-noshrink absolute right mr-3">
                        <Hamburger expanded={expanded} onToggle={onToggleExpand} className="opacity-on-focus" />
                    </div>
                </div>
                {primary ? <div className="px-3 pb-2 flex-item-noshrink no-mobile">{primary}</div> : null}
                <div className="mt-1 md:mt-0" aria-hidden="true" />
                <div className="flex-item-fluid flex-nowrap flex flex-column overflow-overlay pb-4">{children}</div>
                {APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                    <div className="app-infos px-3">
                        <SidebarStorageMeter
                            label={`${c('Storage').t`Your current storage:`} ${humanSize(UsedSpace)} / ${humanSize(
                                MaxSpace
                            )}`}
                            value={Math.ceil(spacePercentage)}
                        />
                        <div className="flex flex-nowrap flex-justify-space-between py-2">
                            <span>
                                {canAddStorage ? (
                                    <Tooltip title={c('Storage').t`Upgrade storage`}>
                                        <SettingsLink
                                            path={addUpsellPath('/upgrade', upsellRef)}
                                            className="app-infos-storage text-no-decoration text-xs m-0"
                                        >
                                            {storageText}
                                        </SettingsLink>
                                    </Tooltip>
                                ) : (
                                    <span className="app-infos-storage text-xs m-0">{storageText}</span>
                                )}
                                {storageGift}
                            </span>

                            <span className="app-infos-compact">{version}</span>
                        </div>
                    </div>
                ) : (
                    <div className="border-top">
                        <div className="text-center py-2 px-3">{version}</div>
                    </div>
                )}

                {hasAppLinks ? <MobileAppsLinks app={app || APP_NAME} /> : null}
            </div>
            {expanded ? <div className="sidebar-backdrop" onClick={onToggleExpand}></div> : undefined}
        </>
    );
};

export default Sidebar;
