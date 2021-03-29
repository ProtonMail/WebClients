import React, { ReactNode, useRef, useMemo } from 'react';
import { c } from 'ttag';

import { APPS } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { hasMailProfessional, hasVisionary } from 'proton-shared/lib/helpers/subscription';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import { AppLink } from '../link';
import { Meter } from '../progress';
import { Tooltip } from '../tooltip';
import { useUser, useSubscription, useConfig } from '../../hooks';
import Hamburger from './Hamburger';
import MobileAppsLinks from './MobileAppsLinks';
import { useFocusTrap } from '../focus';
import ButtonLike from '../button/ButtonLike';

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
    const spacePercentage = Math.round((UsedSpace * 100) / MaxSpace);

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
            {humanSize(UsedSpace)}&nbsp;/&nbsp;{humanSize(MaxSpace)}
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
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed customScrollBar-container pb1">
                {children}
            </div>
            {APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                <div className="flex flex-column flex-align-items-center">
                    {canAddStorage ? (
                        <Tooltip title={c('Storage').t`Upgrade storage`}>
                            <ButtonLike
                                as={AppLink}
                                to="/subscription"
                                shape="link"
                                toApp={getAccountSettingsApp()}
                                className="color-inherit hover-same-color text-no-decoration text-xs text-center mb0-5"
                                title={c('Storage').t`Add storage space`}
                            >
                                {storageText}
                            </ButtonLike>
                        </Tooltip>
                    ) : (
                        <span className="text-xs text-center mt0 mb0-5">{storageText}</span>
                    )}
                    <Meter variant="thin" className="mb0-5 w70" value={spacePercentage} />
                </div>
            ) : null}
            {version}
            {hasAppLinks ? <MobileAppsLinks /> : null}
        </div>
    );
};

export default Sidebar;
