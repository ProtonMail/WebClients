import type { ExtensionLocalData, ExtensionSessionData } from '@proton/pass/types';

import { default as localStorage } from './local';
import { default as sessionStorage } from './session';
import type { Storage } from './types';

export const browserSessionStorage = sessionStorage as Storage<ExtensionSessionData>;
export const browserLocalStorage = localStorage as Storage<ExtensionLocalData>;
