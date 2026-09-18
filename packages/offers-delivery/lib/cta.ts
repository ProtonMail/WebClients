import { CampaignCtaType, type MaybeNull, type PublicCta, type ResolvedCta } from '../interface';
import { sanitizeHttpsUrl } from './validation';

/** The only symbolic `InternalGoTo` ref the gateway emits; anything else means
 * a contract change and resolves to `null`. */
const INTERNAL_REF_UPGRADE = 'GoToUpsell';

/** The only place a raw server `ref` is read; never stored. */
export const resolveCta = (type: CampaignCtaType, ref: string): MaybeNull<ResolvedCta> => {
    if (type === CampaignCtaType.EXTERNAL_GO_TO) {
        const href = sanitizeHttpsUrl(ref);
        return href === null ? null : { kind: 'external', href };
    }

    return ref === INTERNAL_REF_UPGRADE ? { kind: 'upgrade' } : null;
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

export type CtaHandlers = {
    onExternalLink: (url: string) => void;
    onUpgrade?: (coupon: MaybeNull<string>) => void;
};

export const performCta = (cta: ResolvedCta, { onExternalLink, onUpgrade }: CtaHandlers): void => {
    switch (cta.kind) {
        case 'external':
            return onExternalLink(cta.href);
        case 'upgrade':
            return onUpgrade?.(null);
    }
};
