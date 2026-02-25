import React, { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, SettingsLink } from '@proton/components';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectShowDuration } from '@proton/meet/store/slices';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useMeetingDuration } from '../../hooks/useMeetingDuration';
import { formatDuration } from '../../utils/formatDuration';
import { MeetingDuration } from '../MeetingDuration/MeetingDuration';
import { UpgradeIcon } from '../UpgradeIcon/UpgradeIcon';

import './MeetingName.scss';

interface MeetingNameProps {
    classNames?: { root?: string; name?: string; duration?: string };
}

const CTAContainer = ({ children }: { children: React.ReactNode }) => {
    const meetUpsellEnabled = useFlag('MeetUpsell');
    const showRemainingTimeEnabled = useFlag('MeetRemainingTime');

    const anchorRef = useRef<HTMLDivElement>(null);
    const { paidUser } = useMeetContext();

    const { timeLeftMs, isExpiringSoon } = useMeetingDuration();

    const [showRemainingTime, setShowRemainingTime] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const canOpenDropdown = !paidUser;

    const forceShowPopup = showRemainingTime && canOpenDropdown;

    const isPopupOpen = (isHovered || forceShowPopup) && meetUpsellEnabled;

    const timeLeft = (
        <time dateTime={formatDuration(timeLeftMs)} className="text-tabular-nums" key="time-left">
            {formatDuration(timeLeftMs)}
        </time>
    );

    useEffect(() => {
        setShowRemainingTime(isExpiringSoon && showRemainingTimeEnabled);
    }, [isExpiringSoon, showRemainingTimeEnabled]);

    const handleMouseEnter = () => {
        if (canOpenDropdown) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (!forceShowPopup) {
            setIsHovered(false);
        }
    };

    return (
        <div
            className="relative inline-block h-full flex items-center"
            ref={anchorRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <Dropdown
                className="time-limit-cta-dropdown"
                isOpen={isPopupOpen}
                anchorRef={anchorRef}
                noCaret
                originalPlacement={'bottom-start'}
                availablePlacements={['top-start', 'bottom-start']}
                disableDefaultArrowNavigation
                autoClose={false}
                autoCloseOutside={true}
                autoCloseOutsideAnchor={true}
                offset={isMobile() ? 8 : 0}
                adaptiveForTouchScreens={false}
            >
                {showRemainingTime ? (
                    <div
                        className="time-limit-cta-popup flex flex-column border border-norm pt-custom pb-custom p-2"
                        style={{ '--pt-custom': '3.5rem', '--pb-custom': '3rem' }}
                    >
                        <div className="w-full flex flex-column gap-2 pl-5 pr-5">
                            <CloseButton
                                onClose={() => {
                                    setShowRemainingTime(false);
                                    setIsHovered(false);
                                }}
                                className="absolute top-custom right-custom"
                                style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                            />
                            <div className="text-3xl text-semibold w-full text-center">
                                {c('Info').jt`Meeting will end in ${timeLeft}`}
                            </div>
                            <div className="color-weak w-full text-center text-semibold">
                                {c('Info').t`Free meetings are limited to 1 hour. This call will disconnect soon.`}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="time-limit-cta-popup p-6">
                        <div className="w-full flex items-start gap-4">
                            <div className="upgrade-icon-container meet-radius flex items-center justify-center">
                                <UpgradeIcon customSize={32} />
                            </div>
                            <div className="flex-1 flex flex-column">
                                <div className="text-lg text-semibold mb-1">{c('Info')
                                    .t`Meet without restrictions`}</div>
                                <div className="color-hint text-sm">
                                    {c('Info')
                                        .t`Upgrade to remove the 1-hour limit and skip the countdown. Enjoy meetings up to 24 hours.`}
                                </div>
                            </div>
                            <SettingsLink className="w-full" path={'/dashboard'} target={'_blank'}>
                                <Button
                                    className="create-account-button rounded-full color-invert reload-button py-3 w-full"
                                    color="norm"
                                    size="medium"
                                >
                                    {c('Action').t`Get Meet Professional`}
                                </Button>
                            </SettingsLink>
                        </div>
                    </div>
                )}
            </Dropdown>
        </div>
    );
};

export const MeetingName = ({ classNames }: MeetingNameProps) => {
    const { isGuestAdmin, roomName, paidUser } = useMeetContext();
    const forceShowDuration = !paidUser;
    const showDuration = useMeetSelector(selectShowDuration) || forceShowDuration;

    // Determine whether to show the CTA based on the guest mode
    const Container = useMemo(() => (isGuestAdmin ? CTAContainer : React.Fragment), [isGuestAdmin]);

    return (
        <Container>
            <div className={clsx('flex items-center gap-2 flex-nowrap items-baseline', classNames?.root)}>
                <div className={clsx('meeting-name flex-1 text-ellipsis overflow-hidden', classNames?.name)}>
                    {roomName}
                </div>
                {showDuration && <MeetingDuration className={classNames?.duration} />}
            </div>
        </Container>
    );
};
