import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useEncryptedTextAnimation } from '../../../hooks/useEncryptedTextAnimation';

interface LumoMainTextProps {
    isOnboardingCompleted?: boolean;
    isSmallScreen: boolean;
    isGhostMode: boolean;
}

const LumoMainText = ({ isOnboardingCompleted, isSmallScreen, isGhostMode }: LumoMainTextProps) => {
    const [previousGhostMode, setPreviousGhostMode] = useState(isGhostMode);
    const shouldAnimate = isGhostMode !== previousGhostMode;

    useEffect(() => {
        setPreviousGhostMode(isGhostMode);
    }, [isGhostMode]);

    let targetText = '';
    if (isGhostMode) {
        targetText = c('collider_2025:Title').t`Ghost mode`;
    }
    // else if (isSmallScreen) {
    //     targetText = c('collider_2025:Title').t`Hey, I'm ${LUMO_SHORT_APP_NAME}. Ask me anything. It's confidential.`;
    // } else if (isOnboardingCompleted) {
    //     targetText = c('collider_2025:Title').t`Hello! How can I help you today?`;
    // }
    else {
        targetText = c('collider_2025:Title').t`How can I help?`;
    }

    const { displayText } = useEncryptedTextAnimation(targetText, { trigger: shouldAnimate, duration: 600 });

    const textClassName = clsx(
        'main-text lh100 transition-all duration-50 ease-out',
        // !isGhostMode && 'mb-8',
        isSmallScreen && 'text-wrap-balance text-center mx-auto',
        !isSmallScreen && !isOnboardingCompleted && 'text-wrap-balance'
    );

    if (isGhostMode) {
        return (
            <div className="mx-auto md:mx-0 mb-8 text-center">
                <h1 className={textClassName}>{displayText}</h1>
                <p className={clsx('color-weak text-lg mt-2 mb-0', isSmallScreen && 'text-center')}>
                    {c('collider_2025:Title').t`This chat disappears when you close it and is never saved.`}
                </p>
            </div>
        );
    }

    if (isSmallScreen) {
        return <h1 className={textClassName}>{displayText}</h1>;
    }

    return <h1 className={clsx(textClassName, 'text-center mb-8 relative z-10')}>{displayText}</h1>;
};

export default LumoMainText;
