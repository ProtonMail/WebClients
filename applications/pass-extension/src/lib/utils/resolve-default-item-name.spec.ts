import type { Mock } from 'vitest';

import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import { PassFeature } from '@proton/pass/types/api/features';

import { WorkerMessageType } from '../../types/messages';
import { sendTabMessage } from '../message/send-message';
import { resolveDefaultItemNameForTab } from './resolve-default-item-name';

vi.mock('../message/send-message', () => ({
    backgroundMessage: <T extends { type: string }>(message: T) => message,
    sendTabMessage: vi.fn(),
}));

describe('resolveDefaultItemNameForTab', () => {
    const tabUrl = parseUrl('https://login.example.com/');
    const ctx = {
        service: {
            featureFlags: {
                resolve: vi.fn().mockResolvedValue({ features: { [PassFeature.PassAutosaveSiteName]: true } }),
            },
        },
    } as any;

    const sendTabMessageMock = sendTabMessage as Mock;

    beforeEach(() => {
        sendTabMessageMock.mockReset();
        ctx.service.featureFlags.resolve.mockResolvedValue({ features: { [PassFeature.PassAutosaveSiteName]: true } });
    });

    test('returns null when PassAutosaveSiteName is disabled', async () => {
        ctx.service.featureFlags.resolve.mockResolvedValueOnce({ features: {} });

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBeNull();
        expect(sendTabMessageMock).not.toHaveBeenCalled();
    });

    test('falls back to domain rules when the content script returns null', async () => {
        sendTabMessageMock.mockResolvedValueOnce({ defaultItemName: null });

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBe('Example');
    });

    test('prefers the content-script response', async () => {
        sendTabMessageMock.mockResolvedValueOnce({ defaultItemName: 'Netflix' });

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBe('Netflix');
        expect(sendTabMessageMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: WorkerMessageType.RESOLVE_DEFAULT_ITEM_NAME }),
            { tabId: 1, frameId: 0 }
        );
    });

    test('falls back to domain rules when the tab is unreachable', async () => {
        sendTabMessageMock.mockRejectedValueOnce(new Error('no receiving end'));

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBe('Example');
    });

    test('falls back to domain rules when the tab response times out', async () => {
        sendTabMessageMock.mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(() => resolve({ defaultItemName: 'Late' }), 500))
        );

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBe('Example');
    });

    test('returns null when feature flag resolution fails', async () => {
        ctx.service.featureFlags.resolve.mockRejectedValueOnce(new Error('unleash unavailable'));

        await expect(resolveDefaultItemNameForTab(ctx, 1, tabUrl)).resolves.toBeNull();
        expect(sendTabMessageMock).not.toHaveBeenCalled();
    });
});
