import { app } from 'electron';

export const isMac = process.platform === 'darwin';
export const isWindows = process.platform === 'win32';
export const isLinux = process.platform === 'linux';
export const isProdEnv = () => app.isPackaged;
