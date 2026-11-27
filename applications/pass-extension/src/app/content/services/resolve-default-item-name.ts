import { PassFeature } from '@proton/pass/types/api/features';

import type { WorkerMessageType } from '../../../types/messages';
import { withContext } from '../context/context';
import { resolveAutosaveSiteName } from '../utils/resolve-autosave-site-name';
import type { FrameMessageHandler } from './client/client.channel';

export const onResolveDefaultItemName: FrameMessageHandler<WorkerMessageType.RESOLVE_DEFAULT_ITEM_NAME> = withContext(
    (ctx, _message, sendResponse) => {
        const enabled = Boolean(ctx?.getFeatureFlags()[PassFeature.PassAutosaveSiteName]);
        if (!enabled) {
            sendResponse({ defaultItemName: null });
            return true;
        }

        const parsedFrameUrl = ctx?.getExtensionContext()?.frameUrl;
        const pageUrl = parsedFrameUrl?.cleanUrl ?? parsedFrameUrl?.url ?? globalThis.location.href;
        const defaultItemName = resolveAutosaveSiteName(document, pageUrl);

        sendResponse({ defaultItemName });
        return true;
    }
);
