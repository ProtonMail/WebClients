import { type CSSProperties, useEffect, useRef, useState } from 'react';

export const useCodeAnimation = (code: string, enableAnimation: boolean = false) => {
    const [animationKey, setAnimationKey] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const initialCode = useRef(code);

    const shouldAnimate = enableAnimation && code !== initialCode.current;

    useEffect(() => {
        if (!shouldAnimate) return setIsAnimating(false);

        setIsAnimating(false);
        setAnimationKey((prev) => prev + 1);

        const timer = setTimeout(() => setIsAnimating(true), 50);
        return () => clearTimeout(timer);
    }, [shouldAnimate]);

    const getAnimationStyles = (index: number): CSSProperties => {
        if (!shouldAnimate) return { display: 'inline-block' };

        return {
            display: 'inline-block',
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'translateY(0)' : `translateY(${index % 2 === 0 ? -20 : 20}px)`,
            transitionProperty: isAnimating ? 'opacity, transform' : 'none',
            transitionDuration: isAnimating ? '0.5s' : '0s',
            transitionDelay: isAnimating ? `${index * 50}ms` : '0s',
            transitionTimingFunction: 'ease-out',
        };
    };

    return { animationKey, getAnimationStyles };
};
