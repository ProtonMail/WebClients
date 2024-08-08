import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context';
import { getWebsiteRules } from 'proton-pass-extension/app/worker/services/website-rules';

import { type WebsiteRulesMessage, WorkerMessageType } from '@proton/pass/types';

describe('getWebsiteRules', () => {
    let ctx: WorkerContextInterface;
    const message: WebsiteRulesMessage = { type: WorkerMessageType.WEBSITE_RULES_REQUEST };

    beforeEach(() => {
        ctx = {
            service: {
                storage: {
                    local: {
                        getItem: jest.fn(),
                    },
                },
            },
        } as unknown as WorkerContextInterface;
        (ctx.service.storage.local.getItem as jest.Mock).mockResolvedValue(
            JSON.stringify({
                rules: {
                    'example.com': ['hostname rule1', 'hostname rule2'],
                    'example.com/path': ['path rule'],
                    'proton.me/path': ['path rule'],
                },
                version: 1,
            })
        );
    });

    it('returns hostname rules for a clean URL without path', async () => {
        const mockSender = { url: 'https://example.com' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: ['hostname rule1', 'hostname rule2'] });
    });

    it('returns hostname rules for an unclean URL without path', async () => {
        const mockSender = { url: 'https://example.com/#hash?search=test' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: ['hostname rule1', 'hostname rule2'] });
    });

    it('returns hostname & pathname rules for a clean URL with pathname', async () => {
        const mockSender = { url: 'https://example.com/path' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: ['hostname rule1', 'hostname rule2', 'path rule'] });
    });

    it('returns hostname & pathname rules for an unclean URL with pathname', async () => {
        const mockSender = { url: 'https://example.com/path#hash?search=test/' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: ['hostname rule1', 'hostname rule2', 'path rule'] });
    });

    it('returns empty array when no rules exist for the URL', async () => {
        const mockSender = { url: 'https://example.org' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: [] });
    });

    it('returns empty array if the URL has no pathname and rules exist only for the same URL with pathname', async () => {
        const mockSender = { url: 'https://proton.me' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: [] });
    });

    it('returns null when JSON is undefined', async () => {
        (ctx.service.storage.local.getItem as jest.Mock).mockResolvedValue(undefined);
        const mockSender = { url: 'https://example.com' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: null });
    });

    it('returns null when JSON structure invalid', async () => {
        (ctx.service.storage.local.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ invalid: 'structure' }));
        const mockSender = { url: 'https://example.com' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: null });
    });

    it('returns null when no URL is provided', async () => {
        const mockSender = {};
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: null });
    });

    it('returns null when URL is invalid', async () => {
        const mockSender = { url: 'invalid-url' };
        const result = await getWebsiteRules(ctx, message, mockSender);
        expect(result).toEqual({ result: null });
    });
});
