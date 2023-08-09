import { MutableRefObject, ReactElement, ReactNode, cloneElement, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { DAY } from '@proton/shared/lib/constants';
import starImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';

import { FeatureCode } from '../../containers';
import { useDrawer, useSpotlightOnFeature, useWelcomeFlags } from '../../hooks';
import useUser from '../../hooks/useUser';
import { Spotlight, useSpotlightShow } from '../spotlight';

import './DrawerSidebar.scss';

interface Props {
    buttons: ReactElement[];
    settingsButton: ReactNode;
    spotlightSeenRef?: MutableRefObject<boolean>;
}

const DrawerSidebar = ({ buttons, settingsButton, spotlightSeenRef }: Props) => {
    const [user] = useUser();
    const { appInView, setDrawerSidebarMounted } = useDrawer();
    const [welcomeFlags] = useWelcomeFlags();

    useEffect(() => {
        setDrawerSidebarMounted(true);
    }, []);

    const spotlightRef = useRef<HTMLDivElement>(null);

    const { show: showSpotlight, onDisplayed: onDisplayedSpotlight } = useSpotlightOnFeature(
        FeatureCode.QuickSettingsSpotlight
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    // We don't want to show the spotlight if the user just created his account
    const userCreateTime = user.CreateTime || 0;
    const isAccountOlderThanThreeDays = Date.now() > userCreateTime * 1000 + 3 * DAY;

    const canShowSpotlight =
        shouldShowSpotlight && isAccountOlderThanThreeDays && welcomeFlags.isDone && !spotlightSeenRef?.current;

    useEffect(() => {
        setDrawerSidebarMounted(true);
    }, []);

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `sidebar-button-${index}`, style: { '--index': index } })
    );

    return (
        <nav
            aria-label={c('Landmarks').t`Side panel`}
            className={clsx('drawer-sidebar no-mobile no-print', appInView && 'drawer-sidebar--hide-on-tablet')}
        >
            <span className="flex flex-column flex-align-items-center flex-justify-space-between py-3 h100">
                <div className="flex flex-column flex-align-items-center gap-5">{clonedButtons}</div>

                <Spotlight
                    originalPlacement="right"
                    show={canShowSpotlight}
                    onDisplayed={onDisplayedSpotlight}
                    anchorRef={spotlightRef}
                    style={{ maxWidth: '25rem' }}
                    content={
                        <>
                            <div className="flex flex-nowrap my-2">
                                <div className="flex-item-noshrink mr-4">
                                    <img src={starImg} className="w4e" alt="" />
                                </div>
                                <div>
                                    <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`Quick settings`}</p>
                                    <p className="m-0">{c('Spotlight')
                                        .t`Easily access and customize your app experience.`}</p>
                                </div>
                            </div>
                        </>
                    }
                >
                    <div ref={spotlightRef}>{settingsButton}</div>
                </Spotlight>
            </span>
        </nav>
    );
};

export default DrawerSidebar;
