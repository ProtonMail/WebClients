import { ComponentPropsWithoutRef, ReactNode, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { hasMailProfessional, hasNewVisionary, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import percentage from '@proton/utils/percentage';

import { classnames } from '../../helpers';
import { useConfig, useSubscription, useUser } from '../../hooks';
import { useFocusTrap } from '../focus';
import { SettingsLink } from '../link';
import { Meter, getMeterColor } from '../progress';
import { Tooltip } from '../tooltip';
import Hamburger from './Hamburger';
import MobileAppsLinks from './MobileAppsLinks';

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
            <span className={classnames(['used-space text-bold', `color-${getMeterColor(spacePercentage)}`])}>
                {humanSize(UsedSpace)}
            </span>
            &nbsp;/&nbsp;<span className="max-space">{humanSize(MaxSpace)}</span>
        </>
    );

    return (
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
                <div className="no-desktop no-tablet flex-item-noshrink">
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {primary ? <div className="px0-5 pb0-5 flex-item-noshrink">{primary}</div> : null}
            <div className="on-mobile-mt1" aria-hidden="true" />
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed pb1">{children}</div>
            {APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                <div className="app-infos px1">
                    <Meter
                        thin
                        label={`${c('Storage').t`Your current storage:`} ${humanSize(UsedSpace)} / ${humanSize(
                            MaxSpace
                        )}`}
                        value={Math.ceil(spacePercentage)}
                    />
                    <div className="flex flex-nowrap flex-justify-space-between py0-5">
                        <span>
                            {canAddStorage ? (
                                <Tooltip title={c('Storage').t`Upgrade storage`}>
                                    <SettingsLink
                                        path="/upgrade"
                                        className="app-infos-storage text-no-decoration text-xs m0"
                                    >
                                        {storageText}
                                    </SettingsLink>
                                </Tooltip>
                            ) : (
                                <span className="app-infos-storage text-xs m0">{storageText}</span>
                            )}
                            {storageGift}
                        </span>

                        <span className="app-infos-compact">{version}</span>
                    </div>
                </div>
            ) : (
                <div className="border-top">
                    <div className="text-center pt0-5 pr1 pb0-5 pl1">{version}</div>
                </div>
            )}

            {hasAppLinks ? <MobileAppsLinks app={app || APP_NAME} /> : null}
        </div>
    );
};

export default Sidebar;
