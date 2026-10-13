import { useCallback, useEffect, useState } from 'react';

const DETACHED_WINDOW_FEATURES = 'popup=yes,width=1100,height=800';

const copyStyles = (target: Document) => {
    document.querySelectorAll('style').forEach((style) => {
        target.head.appendChild(style.cloneNode(true));
    });

    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
        const copy = target.createElement('link');
        copy.rel = 'stylesheet';
        copy.href = link.href;
        target.head.appendChild(copy);
    });

    target.documentElement.className = document.documentElement.className;
    target.body.className = document.body.className;
};

export const useDetachedWindow = (title: string) => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    const open = useCallback(() => {
        if (container) {
            container.ownerDocument.defaultView?.focus();
            return;
        }

        const detachedWindow = window.open('', '', DETACHED_WINDOW_FEATURES);

        if (!detachedWindow) {
            return;
        }

        detachedWindow.document.title = title;
        copyStyles(detachedWindow.document);
        setContainer(detachedWindow.document.body);
    }, [title, container]);

    useEffect(() => {
        const detachedWindow = container?.ownerDocument.defaultView;

        if (!detachedWindow) {
            return;
        }

        const forgetDetachedWindow = () => setContainer(null);
        const closeDetachedWindow = () => detachedWindow.close();

        detachedWindow.addEventListener('pagehide', forgetDetachedWindow);
        window.addEventListener('pagehide', closeDetachedWindow);

        return () => {
            detachedWindow.removeEventListener('pagehide', forgetDetachedWindow);
            window.removeEventListener('pagehide', closeDetachedWindow);
            detachedWindow.close();
        };
    }, [container]);

    return { container, open };
};
