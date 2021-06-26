import React, { ReactNode, useRef, useMemo } from 'react';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import percentage from '@proton/shared/lib/helpers/percentage';
import { hasMailProfessional, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { SettingsLink } from '../link';
import { Meter, getMeterColor } from '../progress';
import { Tooltip } from '../tooltip';
import { useUser, useSubscription, useConfig } from '../../hooks';
import Hamburger from './Hamburger';
import MobileAppsLinks from './MobileAppsLinks';
import { useFocusTrap } from '../focus';
import { classnames } from '../../helpers';

interface Props {
    logo?: React.ReactNode;
    expanded?: boolean;
    onToggleExpand?: () => void;
    primary?: ReactNode;
    children?: ReactNode;
    version?: ReactNode;
    hasAppLinks?: boolean;
}

const Sidebar = ({ expanded = false, onToggleExpand, hasAppLinks = true, logo, primary, children, version }: Props) => {
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
        if (hasVisionary(subscription) || hasMailProfessional(subscription)) {
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
            className="sidebar flex flex-nowrap flex-column no-print no-outline"
            data-expanded={expanded}
            {...focusTrapProps}
        >
            <div className="no-desktop no-tablet flex-item-noshrink">
                <div className="flex flex-justify-space-between flex-align-items-center pl1 pr1">
                    {logo}
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {primary ? <div className="pl1 pr1 pb1 flex-item-noshrink">{primary}</div> : null}
            <div className="on-mobile-mt1" aria-hidden="true" />
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed pb1">{children}</div>
            {APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                <div className="app-infos">
                    <Meter
                        thin
                        squared
                        label={`${c('Storage').t`Your current storage:`} ${humanSize(UsedSpace)} / ${humanSize(
                            MaxSpace
                        )}`}
                        value={Math.ceil(spacePercentage)}
                    />
                    <div className="flex flex-nowrap flex-justify-space-between pt0-5 pr1-5 pb0-5 pl1-5">
                        {canAddStorage ? (
                            <Tooltip title={c('Storage').t`Upgrade storage`}>
                                <SettingsLink
                                    path="/dashboard"
                                    className="app-infos-storage text-no-decoration text-xs m0"
                                >
                                    {storageText}
                                </SettingsLink>
                            </Tooltip>
                        ) : (
                            <span className="app-infos-storage text-xs m0">{storageText}</span>
                        )}
                        {version}
                    </div>
                </div>
            ) : (
                <div className="border-top">
                    <div className="text-center pt0-5 pr1 pb0-5 pl1">{version}</div>
                </div>
            )}
            {hasAppLinks ? <MobileAppsLinks /> : null}
        </div>
    );
};

export default Sidebar;
