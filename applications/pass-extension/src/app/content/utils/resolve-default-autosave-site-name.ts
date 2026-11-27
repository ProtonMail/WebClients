import { PassFeature } from '@proton/pass/types/api/features';
import type { MaybeNull } from '@proton/pass/types/utils';

import type { ContentScriptContext } from '../context/types';
import { resolveAutosaveSiteName } from './resolve-autosave-site-name';

export const resolveDefaultAutosaveSiteNameForPage = (
    ctx: Pick<ContentScriptContext, 'getFeatureFlags' | 'getExtensionContext'>,
    document: Document
): MaybeNull<string> => {
    if (!ctx.getFeatureFlags()[PassFeature.PassAutosaveSiteName]) return null;

    const parsedFrameUrl = ctx.getExtensionContext()?.frameUrl;
    const pageUrl = parsedFrameUrl?.cleanUrl ?? parsedFrameUrl?.url ?? globalThis.location.href;

    return resolveAutosaveSiteName(document, pageUrl);
};
