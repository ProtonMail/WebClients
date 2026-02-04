import type { BrowserWindow, Session } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

export type PassElectronContext = {
    session: MaybeNull<Session>;
    window: MaybeNull<BrowserWindow>;
    quitting: boolean;
};
