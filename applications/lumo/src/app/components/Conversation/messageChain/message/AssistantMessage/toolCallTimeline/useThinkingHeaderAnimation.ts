import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

const SCRAMBLE_CHARS = '0123456789ABCDEF';
const SCRAMBLE_STEPS = 12;
const SCRAMBLE_DURATION_MS = 480;
const PHRASE_INTERVAL_MS = 2600;

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function shuffleStable<T>(items: readonly T[], seed: string): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = hashString(`${seed}:${i}`) % (i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getGeneratingPhrases(): string[] {
    return [
        c('collider_2025:Reasoning').t`Thinking`,
        c('collider_2025:Reasoning').t`Working on this`,
        c('collider_2025:Reasoning').t`One moment`,
        c('collider_2025:Reasoning').t`Looking into this`,
        c('collider_2025:Reasoning').t`Searching`,
        c('collider_2025:Reasoning').t`Checking sources`,
    ];
}

function scrambleToTarget(targetText: string, onUpdate: (value: string) => void, onComplete: () => void): () => void {
    const totalChars = targetText.length;
    const revealedChars = new Set<number>();
    const stepDelay = SCRAMBLE_DURATION_MS / SCRAMBLE_STEPS;
    let step = 0;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = () => {
        if (cancelled) return;

        if (step >= SCRAMBLE_STEPS) {
            onUpdate(targetText);
            onComplete();
            return;
        }

        const progress = step / SCRAMBLE_STEPS;
        const charsToReveal = Math.floor(progress * totalChars);

        while (revealedChars.size < charsToReveal && revealedChars.size < totalChars) {
            let nextChar = revealedChars.size;
            if (Math.random() < 0.3 && nextChar + 1 < totalChars) {
                nextChar = revealedChars.size + Math.floor(Math.random() * 2);
            }
            revealedChars.add(nextChar);
        }

        let nextText = '';
        for (let i = 0; i < targetText.length; i++) {
            if (targetText[i] === ' ') {
                nextText += ' ';
            } else if (revealedChars.has(i)) {
                nextText += targetText[i];
            } else {
                nextText += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
        }

        onUpdate(nextText);
        step += 1;
        timeoutId = setTimeout(animate, stepDelay);
    };

    animate();

    return () => {
        cancelled = true;
        clearTimeout(timeoutId);
    };
}

export function useThinkingHeaderAnimation(isActive: boolean, messageId: string): string {
    const phrases = useMemo(
        () => shuffleStable(getGeneratingPhrases(), `${messageId}:thinking-cycle`),
        [messageId]
    );
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayText, setDisplayText] = useState(phrases[0] ?? '');

    useEffect(() => {
        if (!isActive) {
            setPhraseIndex(0);
            setDisplayText(phrases[0] ?? '');
            return;
        }

        const intervalId = setInterval(() => {
            setPhraseIndex((index) => (index + 1) % phrases.length);
        }, PHRASE_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isActive, phrases]);

    useEffect(() => {
        if (!isActive) return;

        const targetText = phrases[phraseIndex] ?? '';
        if (!targetText) return;

        return scrambleToTarget(targetText, setDisplayText, () => undefined);
    }, [isActive, phraseIndex, phrases]);

    return displayText;
}
