import { type Campaign, CampaignVariant } from '../interface';
import { isExpiredCampaign, selectActiveCampaign } from './selection';

const NOW = 1_000_000;

const makeCampaign = (overrides: Partial<Campaign> = {}): Campaign => ({
    campaignKey: 'campaign-1',
    messageKey: 'message-1',
    startTime: NOW - 100,
    endTime: NOW + 100,
    variant: CampaignVariant.BANNER,
    cta: { kind: 'upgrade' },
    message: { title: 'title', body: 'body', ctaText: 'go', imageUrl: null },
    ...overrides,
});

describe('isExpiredCampaign', () => {
    it.each([
        ['one tick before end', { endTime: NOW + 1 }, false],
        ['exactly at end boundary is expired', { endTime: NOW }, true],
        ['one tick after end', { endTime: NOW - 1 }, true],
        ['no endTime never expires', { endTime: null }, false],
    ] as const)('%s', (_label, window, expected) => {
        expect(isExpiredCampaign(makeCampaign(window), NOW)).toBe(expected);
    });

    /* startTime is deliberately not checked -- a backwards-skewed client clock
     * would otherwise suppress a campaign the backend resolved as live. */
    it('does not treat a campaign whose startTime is in the future as expired', () => {
        expect(isExpiredCampaign(makeCampaign({ startTime: NOW + 50 }), NOW)).toBe(false);
    });
});

describe('selectActiveCampaign', () => {
    it('returns the active campaign', () => {
        expect(selectActiveCampaign(makeCampaign(), NOW)?.campaignKey).toBe('campaign-1');
    });

    it('returns nothing when there is no campaign', () => {
        expect(selectActiveCampaign(null, NOW)).toBeUndefined();
    });

    it('returns nothing when the campaign has expired', () => {
        expect(selectActiveCampaign(makeCampaign({ endTime: NOW - 1 }), NOW)).toBeUndefined();
    });

    it('returns a campaign that never expires', () => {
        expect(selectActiveCampaign(makeCampaign({ endTime: null }), NOW)?.campaignKey).toBe('campaign-1');
    });
});
