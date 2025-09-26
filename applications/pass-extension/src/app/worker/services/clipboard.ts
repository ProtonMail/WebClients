import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { setupOffscreenDocument } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { backgroundMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { createExtensionAlarm } from 'proton-pass-extension/lib/utils/alarm';
import { CLIPBOARD_PERMISSIONS } from 'proton-pass-extension/lib/utils/permissions';
import { sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createClipboardService as createCoreClipboardService } from '@proton/pass/lib/clipboard/service';
import { type ClipboardApi, DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';
import browser from '@proton/pass/lib/globals/browser';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import { first } from '@proton/pass/utils/array/first';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

const CLIPBOARD_OFFSCREEN_PATH = 'offscreen.html';

/** Extension clipboard service with platform-specific fallback strategies:
 * 1. Primary: Modern `navigator.clipboard` API (Firefox and future-compliant browsers)
 * 2. Chrome fallback: Offscreen document with legacy `document.execCommand`
 * 3. Safari fallback: Native Swift bridge implementation */
export const extensionClipboardApi: ClipboardApi = {
    read: async () => {
        try {
            if (navigator && navigator.clipboard) return await navigator.clipboard.readText();
        } catch {
            logger.debug('[Clipboard] Failed to read using navigator.clipboard');
        }

        if (BUILD_TARGET === 'chrome') {
            try {
                await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
                return await sendMessage.on(
                    backgroundMessage({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_READ }),
                    (res) => (res.type === 'success' ? res.content : Promise.reject())
                );
            } catch {
                logger.debug('[Clipboard] Failed to read using offscreen document');
            }
        }

        if (BUILD_TARGET === 'safari') {
            try {
                const res = await sendSafariMessage<string>({ readFromClipboard: {} });
                if (res === undefined) throw new Error();
                return res;
            } catch {
                logger.debug('[Clipboard] Failed to read using native Safari implementation');
            }
        }

        logger.error('[Clipboard] No clipboard read strategy worked');
        return '';
    },

    write: async (content) => {
        try {
            if (navigator && navigator.clipboard) return await navigator.clipboard.writeText(content);
        } catch {
            logger.debug('[Clipboard] Failed to write to clipboard using navigator.clipboard');
        }

        if (BUILD_TARGET === 'chrome') {
            try {
                await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
                return await sendMessage.on(
                    backgroundMessage({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, payload: { content } }),
                    (res) => (res.type === 'error' ? Promise.reject() : undefined)
                );
            } catch {
                logger.debug('[Clipboard] Failed to write clipboard using offscreen document');
            }
        }

        if (BUILD_TARGET === 'safari') {
            try {
                return await sendSafariMessage({ writeToClipboard: { Content: content } }).then(noop);
            } catch {
                logger.debug('[Clipboard] Failed to write clipboard using native Safari implementation');
            }
        }

        logger.error('[Clipboard] No clipboard write strategy worked');
    },
};

export const createClipboardService = () => {
    /** Use extension alarm factory to handle clipboard clearing reliably.
     * For delays ≥1min, browser extension alarms survive service worker restarts,
     * while `setTimeout` would be lost when the service worker is terminated. */
    const service = createCoreClipboardService(extensionClipboardApi, createExtensionAlarm);

    /** Handle clipboard permission grants across different contexts. In settings pages,
     * the normal flow completes since the tab remains open. In extension popups, the
     * browser closes the popup after permission dialog, interrupting the normal flow,
     * so we detect this scenario and complete the clipboard operation as fallback.
     * Dedicated popup pages opened as tabs don't auto-close, allowing normal flow. */
    browser.permissions.onAdded.addListener(
        withContext(async (ctx, { permissions = [] }) => {
            if (CLIPBOARD_PERMISSIONS.every((permission) => permissions.includes(permission))) {
                /** Detect if permission prompt was triggered from popup (not settings page).
                 * If the active tab isn't the settings page, assume its popup initiated. */
                const activeTabUrl = first(await browser.tabs.query({ active: true }).catch(() => []))?.url;
                const popupInitiated = !activeTabUrl?.startsWith(browser.runtime.getURL('/settings.html'));

                await wait(500);
                const ttl = selectClipboardTTL(ctx.service.store.getState());

                if (ttl === undefined && popupInitiated) {
                    logger.info('[Clipboard] permission change detected from popup');
                    ctx.service.store.dispatch(
                        settingsEditIntent('behaviors', { clipboard: { timeoutMs: DEFAULT_CLIPBOARD_TTL } }, true)
                    );

                    const value = await service.read().catch(() => '');
                    service.autoClear(DEFAULT_CLIPBOARD_TTL, value);
                }
            }
        })
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_AUTOCLEAR, async ({ payload }) => {
        service.autoClear(payload.timeoutMs, payload.content);
        return true;
    });

    return service;
};
