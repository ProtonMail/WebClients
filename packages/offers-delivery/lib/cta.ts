import { isValidCycle, isValidPlanName } from '@proton/payments/core/type-guards';

import type { CtaUpgradeParams } from '../interface';
import { CampaignCtaType, type MaybeNull, type PublicCta, type ResolvedCta } from '../interface';
import type { RawCta, RawGoToUpsell } from './api';
import { sanitizeHttpsUrl } from './validation';

/** The only `InternalGoTo` destination the gateway emits; anything else means
 * a contract change and resolves to `null`. */
const INTERNAL_DESTINATION_UPGRADE = 'GoToUpsell';

/** Each field is checked rather than trusted, since the params are
 * server-controlled and only typed by assertion. */
const intoCtaParams = (goToUpsell: MaybeNull<RawGoToUpsell> | undefined): MaybeNull<CtaUpgradeParams> => {
    if (!goToUpsell) {
        return null;
    }

    const cycle = goToUpsell.Cycle ?? undefined;
    return {
        coupon: typeof goToUpsell.Coupon === 'string' ? goToUpsell.Coupon : null,
        cycle: isValidCycle(cycle) ? cycle : undefined,
        plan: goToUpsell.Plan !== null && isValidPlanName(goToUpsell.Plan) ? goToUpsell.Plan : undefined,
        disableCycleSelector: goToUpsell.DisableCycleSelector === true,
        disablePlanSelector: goToUpsell.DisablePlanSelector === true,
    };
};

/** The only place a raw server CTA is read; never stored. */
export const resolveCta = (rawCta: RawCta): MaybeNull<ResolvedCta> => {
    if (rawCta.Type === CampaignCtaType.EXTERNAL_GO_TO) {
        const href = sanitizeHttpsUrl(rawCta.ExternalGoTo?.Url);
        return href === null ? null : { kind: 'external', href };
    }

    if (rawCta.Type !== CampaignCtaType.INTERNAL_GO_TO) {
        return null;
    }

    const internalGoTo = rawCta.InternalGoTo;
    return internalGoTo?.Destination === INTERNAL_DESTINATION_UPGRADE
        ? { kind: 'upgrade', params: intoCtaParams(internalGoTo.GoToUpsell) }
        : null;
};

/** A blank or absent `ctaText` means no CTA. Tolerates a non-string since
 * `ctaText` is server-controlled and only typed by assertion. */
export const toPublicCta = (cta: MaybeNull<ResolvedCta>, ctaText: string): MaybeNull<PublicCta> => {
    if (cta === null || typeof ctaText !== 'string' || ctaText.trim() === '') {
        return null;
    }

    return cta.kind === 'external'
        ? { text: ctaText, kind: 'external', href: cta.href }
        : { text: ctaText, kind: 'internal' };
};
