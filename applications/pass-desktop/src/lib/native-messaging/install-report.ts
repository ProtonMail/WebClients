import type { NativeMessagingInstallReport } from '@proton/pass/types/desktop/extension-unlock-with-desktop';

import { setupIpcHandler } from '../ipc';

declare module '../ipc' {
    interface IPCChannels {
        'nm:getInstallReport': IPCChannel<[], NativeMessagingInstallReport[]>;
    }
}

export type ResolveInstallReport = (reports: NativeMessagingInstallReport[]) => void;

/** The renderer can ask for the report before the install has run:
 * the handler answers once `resolve` is called. */
export const setupInstallReportHandler = () => {
    let resolve: ResolveInstallReport = () => {};
    const reports = new Promise<NativeMessagingInstallReport[]>((res) => (resolve = res));
    setupIpcHandler('nm:getInstallReport', () => reports);
    return resolve;
};
