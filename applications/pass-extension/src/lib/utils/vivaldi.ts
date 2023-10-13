import browser from '@proton/pass/lib/globals/browser';

export const isVivaldiBrowser = async (): Promise<boolean> => {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        return 'vivExtData' in tab;
    } catch {
        return false;
    }
};
