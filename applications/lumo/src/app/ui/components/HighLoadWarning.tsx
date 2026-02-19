import React, { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { SignInLink } from './SignInLink';

import './ErrorCard.scss';

const CONFIG = {
    REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
    // REFRESH_INTERVAL: 10 * 1000, // 10 seconds (TESTING)
    CHECK_INTERVAL: 2 * 60 * 1000, // 2 minutes
    // CHECK_INTERVAL: 2 * 1000, // 2 seconds (TESTING)
};

const AuthenticatedHighLoadWarningMessage = () => {
    const { hasLumoPlus } = useLumoPlan();

    if (hasLumoPlus) {
        return c('collider_2025: Warning')
            .jt`We're experiencing high traffic right now, but as a ${LUMO_SHORT_APP_NAME} Plus customer, you're in the fast lane. We're prioritizing your requests as always.`;
    }

    return c('collider_2025: Warning')
        .jt`We're experiencing higher than usual traffic, so responses may be a bit slower than usual. Upgrade to ${LUMO_SHORT_APP_NAME} Plus for priority access during peak times.`;
};

// Component is being kept fairly simple as it will only be shown conditionally based on FF
const HighLoadWarning = () => {
    const [showBanner, setShowBanner] = useState(false);
    const { highLoad: showLumoHighLoadWarning } = useLumoFlags();
    const isGuest = useIsGuest();

    const getDismissalTimestamp = useCallback(() => {
        const dismissed = sessionStorage.getItem('highLoadBannerDismissed');
        return dismissed ? parseInt(dismissed) : null;
    }, []);

    const checkAndShowBanner = useCallback(() => {
        if (!showLumoHighLoadWarning) {
            setShowBanner(false);
            return;
        }

        const dismissedAt = getDismissalTimestamp();
        const now = Date.now();

        if (!dismissedAt || now - dismissedAt > CONFIG.REFRESH_INTERVAL) {
            setShowBanner(true);
        }
    }, [showLumoHighLoadWarning, getDismissalTimestamp]);

    const dismissBanner = useCallback(() => {
        sessionStorage.setItem('highLoadBannerDismissed', Date.now().toString());
        setShowBanner(false);
    }, []);

    useEffect(() => {
        checkAndShowBanner();
        const interval = setInterval(checkAndShowBanner, CONFIG.CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [checkAndShowBanner]);

    const signInLink = <SignInLink className="py-0 color-inherit" key="sign-in-link" />;

    if (!showBanner) {
        return null;
    }

    return (
        <div
            className="flex flex-row w-full md:absolute top-0 right-0 md:w-1/4 md:min-w-custom"
            style={{ '--min-w-custom': '300px' }}
        >
            <div className="error-card high-load-warning flex flex-row items-center gap-2 p-3 relative group-hover-opacity-container md:mt-16 md:mr-3">
                <div className="flex flex-column flex-nowrap gap-2">
                    <span className="error-card-title text-bold">{c('collider_2025: Warning')
                        .jt`${LUMO_SHORT_APP_NAME}'s a busy cat`}</span>
                    <span className="error-card-message">
                        {isGuest ? (
                            c('collider_2025: Warning')
                                .jt`We're experiencing higher than usual traffic, so responses may be a bit slower than usual. ${signInLink} for faster access.`
                        ) : (
                            <AuthenticatedHighLoadWarningMessage />
                        )}
                    </span>
                </div>
                <Button
                    icon
                    onClick={dismissBanner}
                    className="error-card-dismiss-button rounded-full border-weak shrink-0 absolute top-0 right-0 bg-hint group-hover:opacity-100"
                    size="small"
                    color="weak"
                    shape="ghost"
                >
                    <Icon name="cross" size={4}></Icon>
                </Button>
            </div>
        </div>
    );
};

export default HighLoadWarning;
