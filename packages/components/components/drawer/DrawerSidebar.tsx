import { MutableRefObject, ReactElement, cloneElement, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { APPS, APP_NAMES, DAY } from '@proton/shared/lib/constants';
import drawerImg from '@proton/styles/assets/img/illustrations/spotlight-drawer.svg';
import clsx from '@proton/utils/clsx';

import { FeatureCode } from '../../containers';
import { useConfig, useDrawer, useSpotlightOnFeature, useWelcomeFlags } from '../../hooks';
import useUser from '../../hooks/useUser';
import { Spotlight, useSpotlightShow } from '../spotlight';

import './DrawerSidebar.scss';

interface Props {
    buttons: ReactElement[];
    spotlightSeenRef?: MutableRefObject<boolean>;
}

const DrawerSidebar = ({ buttons, spotlightSeenRef }: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const { showDrawerSidebar, appInView, setDrawerSidebarMounted } = useDrawer();
    const hasSidebar = buttons.length > 0;
    const [welcomeFlags] = useWelcomeFlags();

    const spotlightRef = useRef<HTMLElement>(null);

    const { show: showSpotlight, onDisplayed: onDisplayedSpotlight } = useSpotlightOnFeature(
        FeatureCode.SpotlightDrawer
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    // We don't want to show the spotlight if the user just created his account
    const userCreateTime = user.CreateTime || 0;
    const isAccountOlderThanThreeDays = Date.now() > userCreateTime * 1000 + 3 * DAY;

    const needSpotlightApps: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONDRIVE];
    const canShowSpotlight =
        shouldShowSpotlight &&
        isAccountOlderThanThreeDays &&
        needSpotlightApps.includes(APP_NAME) &&
        welcomeFlags.isDone &&
        !spotlightSeenRef?.current;

    useEffect(() => {
        setDrawerSidebarMounted(true);
    }, []);

    if (!hasSidebar || !showDrawerSidebar) {
        return null;
    }

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `sidebar-button-${index}`, style: { '--index': index } })
    );

    return (
        <nav
            aria-label={c('Landmarks').t`Side panel`}
            className={clsx('drawer-sidebar no-print', appInView && 'drawer-sidebar--hide-on-tablet')}
        >
            <Spotlight
                content={
                    <div className="flex flex-nowrap my-2">
                        <div className="flex-item-noshrink mr-4">
                            <img src={drawerImg} className="w4e" alt="" />
                        </div>
                        <div>
                            <div className="text-lg text-bold mb-1">{c('Side panel spotlight')
                                .t`Try the new side panel`}</div>
                            <p className="m-0">
                                {c('Side panel spotlight')
                                    .t`Manage your contacts and view your calendar without leaving your app.`}
                            </p>
                        </div>
                    </div>
                }
                show={canShowSpotlight}
                onDisplayed={onDisplayedSpotlight}
                originalPlacement="left"
                anchorRef={spotlightRef}
            >
                <span ref={spotlightRef} className="flex flex-column flex-align-items-center flex-gap-2 mt-2">
                    {clonedButtons}
                </span>
            </Spotlight>
        </nav>
    );
};

export default DrawerSidebar;
