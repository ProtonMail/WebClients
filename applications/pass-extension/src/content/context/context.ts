import { createSharedContext, createSharedContextInjector } from '@proton/pass/utils/context';

import { ContentScriptContext } from './types';

export const CSContext = createSharedContext<ContentScriptContext>('content-script');

export const withContext = createSharedContextInjector(CSContext);
