import { offers } from './blackFriday2026offers';

/**
 * Refs are `offer_bf_26_<app>_<currentPlan>_<offerPlan>_web`. The current plan and the app are only
 * known at runtime, so the offers declare templates rather than fixed strings. This asserts the shape
 * and the known segments rather than an exact list.
 *
 * The campaign tracks Inbox, Drive and the account app entered from Pass separately, so the app segment
 * is `mail`, `drive` or `pass`, with Calendar reporting as `mail`. Plan names are underscore-separated (`mail_plus`), so refs do not have a
 * fixed segment count.
 */
describe('blackFriday2026 tracking refs', () => {
    const PRODUCTS = ['mail', 'calendar', 'drive', 'pass'] as const;

    const REF_APPS = ['mail', 'drive', 'pass'];

    const CURRENT_PLANS = [
        'free',
        'plus',
        'mail_plus',
        'drive_plus',
        'vpn_plus',
        'pass_plus',
        'unlimited',
        'duo',
        'family',
    ];

    const OFFER_PLANS = ['unlimited', 'duo', 'family', 'plus'];

    const getEmittedRefs = () => {
        const emitted = new Set<string>();

        Object.values(offers).forEach((offer) => {
            emitted.add(offer.ref);

            if (offer.getRef) {
                PRODUCTS.forEach((product) => {
                    CURRENT_PLANS.forEach((plan) => {
                        emitted.add(offer.getRef!(product, plan));
                    });
                });
            }
        });

        return Array.from(emitted);
    };

    it('emits only refs matching the campaign shape', () => {
        const pattern = new RegExp(
            `^offer_bf_26_(${REF_APPS.join('|')})_(${CURRENT_PLANS.join('|')})_(${OFFER_PLANS.join('|')})_web$`
        );

        getEmittedRefs().forEach((ref) => {
            expect(ref).toMatch(pattern);
        });
    });

    it('never emits a calendar app segment', () => {
        getEmittedRefs().forEach((ref) => {
            expect(ref).not.toContain('calendar');
        });
    });

    // Spot-check the combinations the data team will key its reporting off.
    it.each([
        ['free-to-unlimited', 'mail', 'free', 'offer_bf_26_mail_free_unlimited_web'],
        ['free-to-unlimited', 'calendar', 'free', 'offer_bf_26_mail_free_unlimited_web'],
        ['free-to-unlimited', 'drive', 'free', 'offer_bf_26_drive_free_unlimited_web'],
        ['free-to-unlimited', 'pass', 'free', 'offer_bf_26_pass_free_unlimited_web'],
        ['plus-to-unlimited', 'mail', 'mail_plus', 'offer_bf_26_mail_plus_unlimited_web'],
        ['plus-to-unlimited', 'calendar', 'vpn_plus', 'offer_bf_26_mail_plus_unlimited_web'],
        ['plus-to-unlimited', 'drive', 'drive_plus', 'offer_bf_26_drive_plus_unlimited_web'],
        ['plus-to-unlimited', 'drive', 'mail_plus', 'offer_bf_26_drive_plus_unlimited_web'],
        ['plus-to-unlimited', 'pass', 'pass_plus', 'offer_bf_26_pass_plus_unlimited_web'],
        ['unlimited-to-duo', 'mail', 'unlimited', 'offer_bf_26_mail_unlimited_duo_web'],
        ['unlimited-to-duo', 'calendar', 'unlimited', 'offer_bf_26_mail_unlimited_duo_web'],
        ['unlimited-to-duo', 'drive', 'unlimited', 'offer_bf_26_drive_unlimited_duo_web'],
        ['unlimited-to-duo', 'pass', 'unlimited', 'offer_bf_26_pass_unlimited_duo_web'],
        ['duo-to-family', 'mail', 'duo', 'offer_bf_26_mail_duo_family_web'],
        ['duo-to-family', 'calendar', 'duo', 'offer_bf_26_mail_duo_family_web'],
        ['duo-to-family', 'drive', 'duo', 'offer_bf_26_drive_duo_family_web'],
        ['duo-to-family', 'pass', 'duo', 'offer_bf_26_pass_duo_family_web'],
    ] as const)('%s in %s on %s emits %s', (key, product, currentPlan, expected) => {
        expect(offers[key].getRef?.(product, currentPlan)).toBe(expected);
    });

    // Each wave 2 offer runs in exactly one place, so its ref is static rather than a template.
    it.each([
        ['free-to-mail-plus', 'offer_bf_26_mail_free_plus_web'],
        ['free-to-drive-plus', 'offer_bf_26_drive_free_plus_web'],
        ['free-to-pass-plus', 'offer_bf_26_pass_free_plus_web'],
    ] as const)('%s emits %s', (key, expected) => {
        expect(offers[key].ref).toBe(expected);
        expect(offers[key].getRef).toBeUndefined();
    });

    it('gives every offer a distinct ID and feature code', () => {
        const ids = Object.values(offers).map(({ ID }) => ID);
        const featureCodes = Object.values(offers).map(({ featureCode }) => featureCode);

        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(featureCodes).size).toBe(featureCodes.length);
    });
});
