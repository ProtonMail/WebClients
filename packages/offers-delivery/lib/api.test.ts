import { CampaignCtaType, CampaignEventAction, CampaignVariant } from '../interface';
import { type OffersRoutes, getCampaign, sendCampaignEvent } from './api';

const routes: OffersRoutes = {
    getCampaign: () => ({ url: 'inapp/evaluate', method: 'get' }),
    sendCampaignEvent: (dto) => ({ url: 'inapp/campaign/event', method: 'post', data: dto }),
};

const bannerCampaign = () => ({
    CampaignKey: 'summer_promo',
    MessageKey: 'pass_upsell',
    Cta: { Type: CampaignCtaType.INTERNAL_GO_TO, Ref: 'GoToUpsell' },
    MessageBody: {
        Banner: {
            Title: 'Title',
            Body: 'Description',
            CtaText: 'CTA',
            Images: [
                { Name: 'a', Url: 'https://cdn.proton.me/a.png' },
                { Name: 'b', Url: 'https://cdn.proton.me/b.png' },
            ],
        },
        Modal: null,
        Minimizable: null,
        Variant: CampaignVariant.BANNER,
    },
    StartTime: 1786628940,
    EndTime: null,
});

const apiReturning = (value: unknown) => jest.fn().mockResolvedValue(value);

describe('getCampaign', () => {
    it('normalizes a banner campaign and resolves the flagged variant body', async () => {
        const api = apiReturning({ Campaign: bannerCampaign(), Code: 1000 });

        const campaign = await getCampaign(api, routes);

        expect(campaign).toEqual({
            campaignKey: 'summer_promo',
            messageKey: 'pass_upsell',
            startTime: 1786628940,
            endTime: null,
            variant: CampaignVariant.BANNER,
            cta: { kind: 'upgrade' },
            message: {
                title: 'Title',
                body: 'Description',
                ctaText: 'CTA',
                imageUrl: 'https://cdn.proton.me/a.png',
            },
        });
    });

    it('takes the first image and rejects a non-https one', async () => {
        const raw = bannerCampaign();
        raw.MessageBody.Banner.Images = [{ Name: 'a', Url: 'http://cdn.proton.me/a.png' }];
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.message.imageUrl).toBeNull();
    });

    it('yields a null image when there are no images', async () => {
        const raw = bannerCampaign();
        raw.MessageBody.Banner.Images = [];
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.message.imageUrl).toBeNull();
    });

    it('reads the image url off the object rather than the element itself', async () => {
        const raw = bannerCampaign();
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.message.imageUrl).toBe('https://cdn.proton.me/a.png');
    });

    it('resolves an ExternalGoTo cta to its href rather than dropping it', async () => {
        const raw = bannerCampaign();
        raw.Cta = { Type: CampaignCtaType.EXTERNAL_GO_TO, Ref: 'https://proton.me/promo' };
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.cta).toEqual({
            kind: 'external',
            href: 'https://proton.me/promo',
        });
    });

    it('drops a Minimizable campaign instead of throwing on its foreign body', async () => {
        const raw = bannerCampaign();
        raw.MessageBody = {
            ...raw.MessageBody,
            Variant: CampaignVariant.MINIMIZABLE,
            Minimizable: { MinimizedText: 'Save 50%', CloseText: 'Dismiss', ImageAltText: '', StartMinimized: true },
        } as unknown as typeof raw.MessageBody;
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        await expect(getCampaign(api, routes)).resolves.toBeNull();
    });

    it.each([['constructor'], ['Variant'], ['__proto__'], ['toString']])(
        'drops a campaign whose Variant is the hostile key %s',
        async (variant) => {
            const raw = bannerCampaign();
            (raw.MessageBody as unknown as { Variant: string }).Variant = variant;
            const api = apiReturning({ Campaign: raw, Code: 1000 });

            await expect(getCampaign(api, routes)).resolves.toBeNull();
        }
    );

    it('keeps a campaign with a valid cta but no CtaText, degrading ctaText to empty', async () => {
        const raw = bannerCampaign();
        delete (raw.MessageBody.Banner as Partial<typeof raw.MessageBody.Banner>).CtaText;
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.message.ctaText).toBe('');
    });

    describe('campaign key validation', () => {
        const withKeys = (campaignKey: unknown, messageKey = 'pass_upsell') => {
            const raw = bannerCampaign();
            Object.assign(raw, { CampaignKey: campaignKey, MessageKey: messageKey });
            return apiReturning({ Campaign: raw, Code: 1000 });
        };

        it.each([
            ['blank', ''],
            ['whitespace-only', '   '],
            ['absent', undefined],
            ['non-string', 42],
        ])('drops a campaign whose CampaignKey is %s', async (_label, campaignKey) => {
            expect(await getCampaign(withKeys(campaignKey), routes)).toBeNull();
        });

        it('drops a campaign whose MessageKey is blank', async () => {
            expect(await getCampaign(withKeys('summer_promo', ''), routes)).toBeNull();
        });

        it('drops a campaign whose CampaignKey exceeds the length cap', async () => {
            expect(await getCampaign(withKeys('k'.repeat(129)), routes)).toBeNull();
        });

        it('keeps a CampaignKey exactly at the length cap', async () => {
            const key = 'k'.repeat(128);

            expect((await getCampaign(withKeys(key), routes))?.campaignKey).toBe(key);
        });

        it('measures a padded CampaignKey trimmed but stores it verbatim', async () => {
            expect((await getCampaign(withKeys('  summer_promo  '), routes))?.campaignKey).toBe('  summer_promo  ');
        });
    });

    it('returns null when there is no campaign', async () => {
        expect(await getCampaign(apiReturning({ Campaign: null, Code: 1000 }), routes)).toBeNull();
    });

    it('returns null on a non-success code', async () => {
        expect(await getCampaign(apiReturning({ Campaign: bannerCampaign(), Code: 2000 }), routes)).toBeNull();
    });

    it('returns null when the flagged variant body is absent', async () => {
        const raw = bannerCampaign();
        raw.MessageBody.Variant = CampaignVariant.MODAL; // Modal is null → nothing renderable
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect(await getCampaign(api, routes)).toBeNull();
    });

    it('carries a null cta through', async () => {
        const raw = bannerCampaign();
        (raw as any).Cta = null;
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.cta).toBeNull();
    });

    it('resolves the cta ref at ingest, dropping a hostile ref to null', async () => {
        const raw = bannerCampaign();
        raw.Cta = { Type: CampaignCtaType.EXTERNAL_GO_TO, Ref: 'javascript:alert(1)' };
        const api = apiReturning({ Campaign: raw, Code: 1000 });

        expect((await getCampaign(api, routes))?.cta).toBeNull();
    });
});

describe('sendCampaignEvent', () => {
    const dto = {
        campaignKey: 'summer_promo',
        messageKey: 'pass_upsell',
        action: CampaignEventAction.CTA_CLICKED,
    };

    const rejectedRequest = () => Object.assign(new Error('bad request'), { status: 422 });

    it('posts the event via the route and returns the dto', async () => {
        const api = apiReturning(undefined);

        await sendCampaignEvent(api, routes, dto);

        expect(api).toHaveBeenCalledWith({ url: 'inapp/campaign/event', method: 'post', data: dto });
    });

    it('carries the documented integer action through an app route mapping', async () => {
        const api = apiReturning(undefined);
        const appRoutes: OffersRoutes = {
            ...routes,
            sendCampaignEvent: ({ campaignKey, messageKey, action }) => ({
                url: 'inapp/campaign/event',
                method: 'post',
                data: { CampaignKey: campaignKey, MessageKey: messageKey, Action: action },
            }),
        };

        await sendCampaignEvent(api, appRoutes, { ...dto, action: CampaignEventAction.DISMISSED });

        expect(api).toHaveBeenCalledWith({
            url: 'inapp/campaign/event',
            method: 'post',
            data: { CampaignKey: 'summer_promo', MessageKey: 'pass_upsell', Action: 4 },
        });
    });

    it('propagates a backend rejection without re-sending', async () => {
        const api = jest.fn().mockRejectedValue(rejectedRequest());

        await expect(sendCampaignEvent(api, routes, dto)).rejects.toThrow('bad request');
        expect(api).toHaveBeenCalledTimes(1);
    });
});
