import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

export type PassElectronContext = { window: MaybeNull<BrowserWindow>; quitting: boolean };
