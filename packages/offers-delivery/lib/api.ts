import { API_CODES } from '@proton/shared/lib/constants';

import {
    type Campaign,
    type CampaignCtaType,
    type CampaignEventDTO,
    type CampaignMessage,
    CampaignVariant,
    type MaybeNull,
} from '../interface';
import { resolveCta } from './cta';
import { sanitizeImageUrl } from './validation';

/** An app's authenticated API client, injected per-app. */
export type OffersApi = <R = any>(config: object) => Promise<R>;

export type OffersRoutes = {
    getCampaign: () => object;
    sendCampaignEvent: (dto: CampaignEventDTO) => object;
};

/** Owned here rather than supplied per app: both endpoints live on the shared
 * API monolith (`bundles/InAppBundle/`), not on a product's own API, so there
 * was never anything app-specific to inject. Still a parameter to the two
 * functions below so their tests can drive them without this indirection.
 *
 * `silence: true` on both: without it any API error carrying a message becomes
 * a user-facing error toast, and `inapp/evaluate` 404s wherever the endpoint is
 * not deployed yet. */
export const offersRoutes: OffersRoutes = {
    getCampaign: () => ({ url: 'inapp/evaluate', method: 'get', silence: true }),
    sendCampaignEvent: ({ campaignKey, messageKey, action }: CampaignEventDTO) => ({
        url: 'inapp/campaign/event',
        method: 'post',
        silence: true,
        data: { CampaignKey: campaignKey, MessageKey: messageKey, Action: action },
    }),
};

type RawCta = {
    Type: CampaignCtaType;
    Ref: string;
};

/** The gateway sends image objects, not URL strings. */
type RawMessageImage = {
    Name: string;
    Url: string;
};

type RawVariantBody = {
    Title: string;
    Body: string;
    CtaText: string;
    Images: MaybeNull<RawMessageImage[]>;
};

/** `Minimizable` is typed `unknown`: its body has a different, unrendered shape. */
type RawMessageBody = {
    Banner?: MaybeNull<RawVariantBody>;
    Modal?: MaybeNull<RawVariantBody>;
    Minimizable?: unknown;
    Variant: CampaignVariant;
};

export type RawCampaign = {
    CampaignKey: string;
    MessageKey: string;
    Cta?: MaybeNull<RawCta>;
    MessageBody: RawMessageBody;
    StartTime: number;
    EndTime?: MaybeNull<number>;
};

type RawEvaluateResponse = {
    Campaign?: MaybeNull<RawCampaign>;
    Code: number;
};

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim() === '';

/** Far above any key the gateway issues. */
const MAX_KEY_LENGTH = 128;

/** `campaignKey`/`messageKey` are echoed back to `inapp/campaign/event`, so
 * shape is checked here. No charset restriction, since they're never rendered
 * or used as a property key. Trimming is for measuring only — a truncated key
 * would silently no-op the echoed event. */
const isValidKey = (value: unknown): value is string =>
    typeof value === 'string' && !isBlank(value) && value.trim().length <= MAX_KEY_LENGTH;

/** Only the first image is used, restricted to the CDN allowlist. `CtaText` is
 * checked too since a missing one would otherwise crash a consumer's render
 * instead of dropping the campaign. */
const intoMessage = (body: RawVariantBody): MaybeNull<CampaignMessage> => {
    if (isBlank(body.Title) || isBlank(body.Body)) {
        return null;
    }

    return {
        title: body.Title,
        body: body.Body,
        ctaText: isBlank(body.CtaText) ? '' : body.CtaText,
        imageUrl: sanitizeImageUrl(body.Images?.[0]?.Url),
    };
};

/** Matches explicitly rather than indexing by the discriminator, so a
 * server-controlled string (`"constructor"`, `"__proto__"`) can't reach a
 * property lookup. */
const resolveVariantBody = (messageBody: RawMessageBody): MaybeNull<RawVariantBody> => {
    switch (messageBody.Variant) {
        case CampaignVariant.BANNER:
            return messageBody.Banner ?? null;
        case CampaignVariant.MODAL:
            return messageBody.Modal ?? null;
        default:
            return null;
    }
};

const intoCampaign = (raw: RawCampaign): MaybeNull<Campaign> => {
    if (!isValidKey(raw.CampaignKey) || !isValidKey(raw.MessageKey)) {
        return null;
    }

    if (typeof raw.MessageBody !== 'object' || raw.MessageBody === null) {
        return null;
    }

    const body = resolveVariantBody(raw.MessageBody);
    if (!body) {
        return null;
    }

    const message = intoMessage(body);
    if (!message) {
        return null;
    }

    return {
        campaignKey: raw.CampaignKey,
        messageKey: raw.MessageKey,
        startTime: raw.StartTime,
        endTime: typeof raw.EndTime === 'number' ? raw.EndTime : null,
        variant: raw.MessageBody.Variant,
        cta: raw.Cta ? resolveCta(raw.Cta.Type, raw.Cta.Ref) : null,
        message,
    };
};

export const getCampaign = async (api: OffersApi, routes: OffersRoutes): Promise<MaybeNull<Campaign>> => {
    const { Campaign, Code } = await api<RawEvaluateResponse>(routes.getCampaign());

    if (Code !== API_CODES.SINGLE_SUCCESS || !Campaign) {
        return null;
    }

    return intoCampaign(Campaign);
};

export const sendCampaignEvent = async (
    api: OffersApi,
    routes: OffersRoutes,
    dto: CampaignEventDTO
): Promise<CampaignEventDTO> => {
    return api(routes.sendCampaignEvent(dto));
};
