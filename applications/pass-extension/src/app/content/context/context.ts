import { createSharedContext, createSharedContextInjector } from '@proton/pass/utils/context';

import type { ContentScriptContext } from './types';

export const CSContext = createSharedContext<ContentScriptContext>('contentscript');

export const withContext = createSharedContextInjector(CSContext);
