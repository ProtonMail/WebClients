import { app } from 'electron';

export const isMac = process.platform === 'darwin';
// MAS (Mac App Store)
export const isMAS = 'mas' in process && process.mas === true;
export const isWindows = process.platform === 'win32';
export const isLinux = process.platform === 'linux';
export const isProdEnv = () => app.isPackaged;
