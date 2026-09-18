export type MaybeNull<T> = T | null;

/** Mirrors `MessageBody.Variant` from `inapp/evaluate`. `Minimizable` has a
 * different body shape entirely, so it's dropped at ingest, not modelled. */
export enum CampaignVariant {
    BANNER = 'Banner',
    MODAL = 'Modal',
    MINIMIZABLE = 'Minimizable',
}

/** Mirrors the gateway's `CtaActionType`. `InternalGoTo` refs are symbolic
 * tokens resolved client-side; `ExternalGoTo` refs are https URLs. */
export enum CampaignCtaType {
    INTERNAL_GO_TO = 'InternalGoTo',
    EXTERNAL_GO_TO = 'ExternalGoTo',
}

/** Reported to `inapp/campaign/event`. Values are the wire contract (integer
 * 1-5, anything else is a 400). Only the two terminal actions suppress a
 * campaign. */
export enum CampaignEventAction {
    SEEN = 1,
    /** Not emitted today: `Minimizable` isn't rendered by this package. */
    MINIMIZED = 2,
    MAXIMIZED = 3,
    /** Terminal — the backend never resolves this campaign for the user again. */
    DISMISSED = 4,
    /** Terminal, like `DISMISSED`. Emitted before the CTA runs. */
    CTA_CLICKED = 5,
}

/** A server `cta.ref` resolved and validated at ingest; never leaves `lib/cta.ts` raw. */
export type ResolvedCta = { kind: 'external'; href: string } | { kind: 'upgrade' };

/** `href` (external only) has already passed `sanitizeHttpsUrl`. Internal
 * targets are reachable only via `onAction`. */
export type PublicCta = { text: string; kind: 'internal' } | { text: string; kind: 'external'; href: string };

export type CampaignMessage = {
    title: string;
    body: string;
    ctaText: string;
    imageUrl: MaybeNull<string>;
};

export type Campaign = {
    campaignKey: string;
    messageKey: string;
    startTime: number;
    endTime: MaybeNull<number>;
    variant: CampaignVariant;
    cta: MaybeNull<ResolvedCta>;
    message: CampaignMessage;
};

/** The campaign shape handed to consumers. */
export type PublicCampaign = Omit<Campaign, 'cta'> & { cta: MaybeNull<PublicCta> };

export type CampaignEventDTO = {
    campaignKey: string;
    messageKey: string;
    action: CampaignEventAction;
};
