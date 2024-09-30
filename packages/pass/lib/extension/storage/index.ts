import type { StorageData, StorageInterface } from '@proton/pass/types';

import { default as localStorage } from './local';
import { default as sessionStorage } from './session';

export const getExtensionLocalStorage = <T extends StorageData>() => localStorage as StorageInterface<T>;
export const getExtensionSessionStorage = <T extends StorageData>() => sessionStorage as StorageInterface<T>;
