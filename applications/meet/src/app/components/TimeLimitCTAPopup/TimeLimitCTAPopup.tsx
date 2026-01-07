import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, SettingsLink } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useMeetingDuration } from '../../hooks/useMeetingDuration';
import { formatDuration } from '../../utils/formatDuration';
import { UpgradeIcon } from '../UpgradeIcon/UpgradeIcon';

import './TimeLimitCTAPopup.scss';

interface TimeLimitCTAPopupProps {
    children: React.ReactNode;
}

export const TimeLimitCTAPopup = ({ children }: TimeLimitCTAPopupProps) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const { paidUser } = useMeetContext();

    const { timeLeftMs, isExpiringSoon } = useMeetingDuration();

    const [showRemainingTime, setShowRemainingTime] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const canOpenDropdown = !paidUser;
    const forceShowPopup = showRemainingTime && canOpenDropdown;

    const isPopupOpen = isHovered || forceShowPopup;

    const timeLeft = formatDuration(timeLeftMs);

    useEffect(() => {
        if (isExpiringSoon) {
            setShowRemainingTime(true);
        }
    }, [isExpiringSoon]);

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
                <div
                    className={clsx(
                        'border border-norm time-limit-cta-popup bg-norm flex flex-column gap-4 mb-4',
                        showRemainingTime ? 'pt-custom pb-custom p-2' : 'p-6'
                    )}
                    style={{
                        '--pt-custom': showRemainingTime ? '3.5rem' : '0',
                        '--pb-custom': showRemainingTime ? '3rem' : '0',
                    }}
                >
                    {showRemainingTime && (
                        <CloseButton
                            onClose={() => {
                                setShowRemainingTime(false);
                                setIsHovered(false);
                            }}
                            className="absolute top-custom right-custom"
                            style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                        />
                    )}
                    {showRemainingTime ? (
                        <div className="w-full flex flex-column gap-2">
                            <div className="text-3xl text-semibold w-full text-center">
                                {c('Info').t`Meeting will end in ${timeLeft}`}
                            </div>
                            <div className="color-weak w-full text-center text-semibold">
                                {c('Info').t`Free meetings are limited to 1 hour. This call will disconnect soon.`}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full flex items-start gap-4">
                                <div
                                    className="upgrade-icon-container meet-radius w-custom h-custom flex items-center justify-center"
                                    style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                                >
                                    <UpgradeIcon customSize={32} />
                                </div>
                                <div className="flex-1 flex flex-column">
                                    <div className="text-lg text-semibold">{c('Info')
                                        .t`Meet without restrictions`}</div>
                                    <div className="color-hint text-sm">
                                        {c('Info')
                                            .t`Upgrade to remove the 1-hour limit and skip the countdown. Enjoy meetings up to 24 hours.`}
                                    </div>
                                </div>
                            </div>
                            <SettingsLink className="w-full" path={'/dashboard'} target={'_blank'}>
                                <Button
                                    className="create-account-button rounded-full color-invert reload-button py-4 text-semibold w-full"
                                    color="norm"
                                    size="large"
                                >
                                    {c('Action').t`Get Meet Professional`}
                                </Button>
                            </SettingsLink>
                        </>
                    )}
                </div>
            </Dropdown>
        </div>
    );
};
