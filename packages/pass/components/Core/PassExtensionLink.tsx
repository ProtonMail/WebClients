import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { usePassExtensionInstalled } from '@proton/pass/hooks/usePassExtensionInstalled';
import { type SupportedExtensionClient, getExtensionSupportedBrowser } from '@proton/pass/lib/extension/utils/browser';
import type { MaybeNull } from '@proton/pass/types';
import { isDesktop } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

type PassExtensionLinkValue = { installed: boolean; supportedBrowser: MaybeNull<SupportedExtensionClient> };

const PassExtensionLinkContext = createContext<PassExtensionLinkValue>({
    installed: true,
    supportedBrowser: null,
});

const supportedBrowser = isDesktop() ? getExtensionSupportedBrowser() : null;

export const PassExtensionLink: FC<PropsWithChildren> = ({ children }) => {
    const installed = usePassExtensionInstalled(supportedBrowser !== null && !isElectronApp);
    const context = useMemo<PassExtensionLinkValue>(() => ({ installed, supportedBrowser }), [installed]);

    return <PassExtensionLinkContext.Provider value={context}>{children}</PassExtensionLinkContext.Provider>;
};

export const usePassExtensionLink = () => useContext(PassExtensionLinkContext);
