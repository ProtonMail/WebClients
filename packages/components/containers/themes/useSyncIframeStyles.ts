import { useEffect } from 'react';

import { classNames, styles } from './properties';

const useSyncIframeStyles = (
    targetEl: HTMLElement | null | undefined,
    sourceEl: HTMLElement | null | undefined = document.documentElement
) => {
    useEffect(() => {
        if (!targetEl || !sourceEl) {
            return;
        }

        const sync = (list: DOMTokenList, style: CSSStyleDeclaration) => {
            Object.values(classNames).forEach((className) => {
                if (list.contains(className)) {
                    targetEl.classList.add(className);
                } else {
                    targetEl.classList.remove(className);
                }
            });

            Object.values(styles).forEach((attribute) => {
                const value = style.getPropertyValue(attribute);
                if (value) {
                    targetEl.style.setProperty(attribute, value);
                } else {
                    targetEl.style.removeProperty(attribute);
                }
            });
        };

        const observer = new MutationObserver((e) => {
            if (e.some(({ attributeName }) => attributeName === 'class' || attributeName === 'style')) {
                sync(sourceEl.classList, sourceEl.style);
            }
        });

        sync(sourceEl.classList, sourceEl.style);

        observer.observe(sourceEl, { attributes: true });
        return () => {
            observer.disconnect();
        };
    }, [targetEl, sourceEl]);
};

export default useSyncIframeStyles;
