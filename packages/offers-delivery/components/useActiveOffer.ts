import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import { getCurrentUnixTimestamp } from '@proton/shared/lib/helpers/time';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { CampaignEventAction, type CampaignVariant, type MaybeNull, type PublicCampaign } from '../interface';
import { performCta, toPublicCta } from '../lib/cta';
import { selectActiveCampaign, sendCampaignEventThunk } from '../store/slice';

export type ActiveOffer = {
    campaign: PublicCampaign;
    /** The only route from a server-controlled CTA to a navigation. Pass the
     * click event when rendering an `<a href={campaign.cta.href}>` so the
     * browser's navigation is not duplicated. */
    onAction: (event?: MouseEvent<HTMLElement>) => void;
    onDismiss: () => void;
    /** Attach to the rendered root. Reports SEEN when the node mounts, which is
     * the point at which the offer is genuinely on screen. */
    seenRef: (node: Element | null) => void;
    /** Escape hatch for consumers that cannot attach a ref. Idempotent. */
    reportSeen: () => void;
};

export type UseActiveOfferOptions = {
    /** Invoked for the `GoToUpsell` token, the only internal ref the gateway
     * emits. Required, not defaulted: a call site that forgets it would render
     * a CTA that reports `CtaClicked` and then does nothing. */
    onUpgrade: (coupon: MaybeNull<string>) => void;
    /** Override for hosts where `window.open` is unavailable (e.g. extensions). */
    onExternalLink?: (url: string) => void;
    /** Let `seenRef` report on mount. Set `false` to own the timing via
     * `reportSeen` — e.g. a lazily-mounted or offscreen surface. */
    autoReportSeen?: boolean;
};

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

/** Returns the campaign to render for the requested variant(s), or `null`.
 *
 * The variant argument is required: it is what tells the package which caller
 * intends to render, which is what keeps SEEN honest under free composition.
 * A variant nobody asks for (e.g. MINIMIZABLE) simply never surfaces.
 *
 * Reads the kill switch itself, so no consuming app gates anything. Fetching is
 * not this hook's job — `startOffersDeliveryListener` owns it, which is why
 * several call sites can use this freely without multiplying requests. */
export const useActiveOffer = (
    variant: CampaignVariant | CampaignVariant[],
    { onUpgrade, onExternalLink = openInNewTab, autoReportSeen = true }: UseActiveOfferOptions
): MaybeNull<ActiveOffer> => {
    const dispatch = baseUseDispatch<ThunkDispatch<any, any, Action>>();
    const enabled = useFlag(CommonFeatureFlag.CentralisedOffersDelivery);

    /* The flag gates the render, not just the fetch: a mid-session flip to off
     * has to hide a campaign that is already in the store. */
    const selected = baseUseSelector(selectActiveCampaign(getCurrentUnixTimestamp()));
    const campaign = enabled ? (selected ?? null) : null;

    const variants = Array.isArray(variant) ? variant : [variant];
    const matchedCampaign = campaign !== null && variants.includes(campaign.variant) ? campaign : null;

    const cta = matchedCampaign?.cta ?? null;
    const hasMatch = matchedCampaign !== null;

    /* Dedupe by `campaignKey` lives in the slice, so every call site and every
     * remount share one decision. */
    const reportSeen = useCallback(() => {
        if (!hasMatch) {
            return;
        }
        void dispatch(sendCampaignEventThunk(CampaignEventAction.SEEN));
    }, [hasMatch, dispatch]);

    const seenRef = useCallback(
        (node: Element | null) => {
            if (node !== null && autoReportSeen) {
                reportSeen();
            }
        },
        [autoReportSeen, reportSeen]
    );

    /* Skips our own navigation for a real `<a href>` anchor, so cmd/middle-click
     * and copy-link still work. */
    const onAction = useCallback(
        (event?: MouseEvent<HTMLElement>) => {
            if (cta === null) {
                return;
            }
            void dispatch(sendCampaignEventThunk(CampaignEventAction.CTA_CLICKED));

            const target = event?.currentTarget;
            if (target instanceof HTMLAnchorElement && target.href !== '') {
                return;
            }

            performCta(cta, { onExternalLink, onUpgrade });
        },
        [cta, dispatch, onExternalLink, onUpgrade]
    );

    const onDismiss = useCallback(() => {
        if (!hasMatch) {
            return;
        }
        void dispatch(sendCampaignEventThunk(CampaignEventAction.DISMISSED));
    }, [hasMatch, dispatch]);

    return useMemo(() => {
        if (matchedCampaign === null) {
            return null;
        }

        return {
            campaign: { ...matchedCampaign, cta: toPublicCta(matchedCampaign.cta, matchedCampaign.message.ctaText) },
            onAction,
            onDismiss,
            seenRef,
            reportSeen,
        };
    }, [matchedCampaign, onAction, onDismiss, seenRef, reportSeen]);
};
