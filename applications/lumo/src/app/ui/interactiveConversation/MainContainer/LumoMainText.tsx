import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

// Custom hook for encrypted text animation
const useEncryptedTextAnimation = (targetText: string, trigger: boolean, duration: number = 600) => {
    const [displayText, setDisplayText] = useState(targetText);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!trigger) {
            setDisplayText(targetText);
            return;
        }

        setIsAnimating(true);
        const chars = '0123456789ABCDEF'; // Simple hex characters
        const totalChars = targetText.length;

        const revealedChars = new Set<number>();
        const animationSteps = 15; // Much fewer steps for speed
        const stepDelay = duration / animationSteps;

        const animate = (step: number) => {
            if (step >= animationSteps) {
                setDisplayText(targetText);
                setIsAnimating(false);
                return;
            }

            // Linear progress for consistent speed
            const progress = step / animationSteps;
            const charsToReveal = Math.floor(progress * totalChars);

            // Reveal characters from left to right with some randomness
            while (revealedChars.size < charsToReveal && revealedChars.size < totalChars) {
                let nextChar = revealedChars.size;
                // Add slight randomness but keep mostly left-to-right
                if (Math.random() < 0.3 && nextChar + 1 < totalChars) {
                    nextChar = revealedChars.size + Math.floor(Math.random() * 2);
                }
                revealedChars.add(nextChar);
            }

            let newText = '';
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === ' ') {
                    newText += ' ';
                } else if (revealedChars.has(i)) {
                    newText += targetText[i];
                } else {
                    newText += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            setDisplayText(newText);
            setTimeout(() => animate(step + 1), stepDelay);
        };

        animate(0);
    }, [targetText, trigger, duration]);

    return { displayText, isAnimating };
};

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
    } else if (isSmallScreen) {
        targetText = c('collider_2025:Title').t`Hey, I'm ${LUMO_SHORT_APP_NAME}. Ask me anything. It's confidential.`;
    } else if (isOnboardingCompleted) {
        targetText = c('collider_2025:Title').t`Hello! How can I help you today?`;
    } else {
        targetText = c('collider_2025:Title').t`Hey, I'm ${LUMO_SHORT_APP_NAME}. Ask me anything. It's confidential.`;
    }

    const { displayText } = useEncryptedTextAnimation(targetText, shouldAnimate, 600);

    const textClassName = `main-text lh100 transition-all duration-50 ease-out  ${
        isSmallScreen ? 'text-wrap-balance text-center mx-auto' : isOnboardingCompleted ? '' : 'text-wrap-balance'
    }`;

    if (isGhostMode) {
        return (
            <div className="mx-auto md:mx-0">
                <h1 className={textClassName}>{displayText}</h1>
                <p className={clsx('color-weak text-lg md:text-xl mt-2 mb-0', isSmallScreen && 'text-center')}>
                    {c('collider_2025:Title').t`This chat disappears when you close it and is never saved.`}
                </p>
            </div>
        );
    }

    if (isSmallScreen) {
        return <h1 className={textClassName}>{displayText}</h1>;
    }

    if (isOnboardingCompleted) {
        return <h1 className={`${textClassName} onboarded`}>{displayText}</h1>;
    }

    return <h1 className={textClassName}>{displayText}</h1>;
};

export default LumoMainText;
