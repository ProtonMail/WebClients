import { createListenerStore } from '@proton/pass/utils/listener/factory';

export const waitForPageReady = (): Promise<void> =>
    new Promise<void>((resolve) => {
        const listeners = createListenerStore();

        const onLoad = () => {
            listeners.removeAll();
            resolve();
        };

        const onStateChange = () => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                listeners.removeAll();
                resolve();
            }
        };

        listeners.addListener(window, 'load', onLoad);
        listeners.addListener(document, 'readystatechange', onStateChange);

        onStateChange();
    });
