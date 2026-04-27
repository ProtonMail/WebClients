import { useEffect, useState } from 'react';

export const useTextVisibility = (isCollapsed: boolean) => {
    const [showText, setShowText] = useState(!isCollapsed);

    useEffect(() => {
        if (isCollapsed) {
            const timer = setTimeout(() => setShowText(false), 200);
            return () => clearTimeout(timer);
        } else {
            setShowText(true);
        }
    }, [isCollapsed]);

    return showText;
};
