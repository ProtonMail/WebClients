import type { State } from '../types';

export const selectClipboardTTL = ({ desktopSettings }: State) => desktopSettings.clipboard.timeoutMs;
