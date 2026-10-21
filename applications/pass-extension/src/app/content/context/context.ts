import {
    InjectionMode,
    contextHandlerFactory,
    contextInjectorFactory,
} from '@proton/pass/utils/context/create-shared-context';

import type { ContentScriptContext } from './types';

export const CSContext = contextHandlerFactory<ContentScriptContext>('contentscript');
export const withContext = contextInjectorFactory(CSContext, InjectionMode.LOOSE);
