import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = '0123456789ABCDEF';
const DEFAULT_DURATION = 600;
const ANIMATION_STEPS = 15;

interface UseEncryptedTextAnimationOptions {
    duration?: number;
    /** Animate on the rising edge of this flag (ghost mode toggle pattern). */
    trigger?: boolean;
    /** Animate whenever targetText changes after the initial render. */
    animateOnChange?: boolean;
}

export function useEncryptedTextAnimation(
    targetText: string,
    { duration = DEFAULT_DURATION, trigger, animateOnChange = false }: UseEncryptedTextAnimationOptions = {}
) {
    const [displayText, setDisplayText] = useState(targetText);
    const [isAnimating, setIsAnimating] = useState(false);
    const previousTargetRef = useRef(targetText);
    const previousTriggerRef = useRef(false);
    const isInitialMountRef = useRef(true);
    const isAnimatingRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const triggerRisingEdge = trigger === true && !previousTriggerRef.current;
        previousTriggerRef.current = trigger === true;

        const shouldAnimateFromChange =
            animateOnChange && !isInitialMountRef.current && targetText !== previousTargetRef.current;

        if (!triggerRisingEdge && !shouldAnimateFromChange) {
            if (!isAnimatingRef.current) {
                setDisplayText(targetText);
            }
            previousTargetRef.current = targetText;
            isInitialMountRef.current = false;
            return;
        }

        previousTargetRef.current = targetText;
        isInitialMountRef.current = false;

        clearTimeout(timeoutRef.current);
        isAnimatingRef.current = true;
        setIsAnimating(true);

        const totalChars = targetText.length;
        const revealedChars = new Set<number>();
        const stepDelay = duration / ANIMATION_STEPS;
        let step = 0;

        const finishAnimation = () => {
            setDisplayText(targetText);
            isAnimatingRef.current = false;
            setIsAnimating(false);
        };

        const animate = () => {
            if (step >= ANIMATION_STEPS) {
                finishAnimation();
                return;
            }

            const progress = step / ANIMATION_STEPS;
            const charsToReveal = Math.floor(progress * totalChars);

            while (revealedChars.size < charsToReveal && revealedChars.size < totalChars) {
                let nextChar = revealedChars.size;
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
                    newText += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                }
            }

            setDisplayText(newText);
            step += 1;
            timeoutRef.current = setTimeout(animate, stepDelay);
        };

        animate();
    }, [targetText, trigger, animateOnChange, duration]);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    return { displayText, isAnimating };
}
