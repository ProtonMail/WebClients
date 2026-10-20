import { useCallback, useEffect, useRef, useState } from 'react';

const TYPING_IDLE_MS = 1500;

export const useTypingActivity = () => {
    const [isTyping, setIsTyping] = useState(false);
    const idleTimeoutRef = useRef<number>();

    const noteKeystroke = useCallback(() => {
        setIsTyping(true);
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = window.setTimeout(() => setIsTyping(false), TYPING_IDLE_MS);
    }, []);

    useEffect(() => () => window.clearTimeout(idleTimeoutRef.current), []);

    return { isTyping, noteKeystroke };
};
