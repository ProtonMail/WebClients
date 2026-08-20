import { offers } from './q3Sale2026offers';

/**
 * Refs are `offer_26_sep_<currentPlan>_<offerPlan>_<app>_web`. The current plan and the app are only
 * known at runtime, so the offers declare templates rather than fixed strings, and the emitted set is
 * wider than the ten the spec lists. This asserts the shape and the known segments rather than an exact
 * list.
 *
 * Plan names are underscore-separated (`mail_plus`), so refs do not have a fixed segment count.
 */
describe('q3Sale2026 tracking refs', () => {
    const APPS = ['mail', 'calendar', 'drive'] as const;

    const CURRENT_PLANS = ['free', 'mail_plus', 'drive_plus', 'vpn_plus', 'pass_plus', 'unlimited', 'duo', 'family'];

    const OFFER_PLANS = ['unlimited', 'duo', 'family', 'family12'];

    const getEmittedRefs = () => {
        const emitted = new Set<string>();

        Object.values(offers).forEach((offer) => {
            emitted.add(offer.ref);

            if (offer.getRef) {
                APPS.forEach((app) => {
                    CURRENT_PLANS.forEach((plan) => {
                        emitted.add(offer.getRef!(app, plan));
                    });
                });
            }
        });

        return Array.from(emitted);
    };

    it('emits only refs matching the campaign shape', () => {
        const pattern = new RegExp(
            `^offer_26_sep_(${CURRENT_PLANS.join('|')})_(${OFFER_PLANS.join('|')})_(${APPS.join('|')})_web$`
        );

        getEmittedRefs().forEach((ref) => {
            expect(ref).toMatch(pattern);
        });
    });

    it('puts the app segment last, before web', () => {
        getEmittedRefs().forEach((ref) => {
            expect(ref).toMatch(/_(mail|calendar|drive)_web$/);
        });
    });

    // Spot-check the combinations the data team will key its reporting off.
    it.each([
        ['free-to-unlimited', 'mail', 'free', 'offer_26_sep_free_unlimited_mail_web'],
        ['free-to-unlimited', 'drive', 'free', 'offer_26_sep_free_unlimited_drive_web'],
        ['plus-to-unlimited', 'mail', 'mail_plus', 'offer_26_sep_mail_plus_unlimited_mail_web'],
        ['plus-to-unlimited', 'mail', 'drive_plus', 'offer_26_sep_drive_plus_unlimited_mail_web'],
        ['plus-to-unlimited', 'drive', 'drive_plus', 'offer_26_sep_drive_plus_unlimited_drive_web'],
        ['plus-to-unlimited', 'calendar', 'drive_plus', 'offer_26_sep_drive_plus_unlimited_calendar_web'],
        ['unlimited-to-duo', 'mail', 'unlimited', 'offer_26_sep_unlimited_duo_mail_web'],
        ['unlimited-to-duo', 'drive', 'unlimited', 'offer_26_sep_unlimited_duo_drive_web'],
        ['unlimited-to-duo', 'calendar', 'unlimited', 'offer_26_sep_unlimited_duo_calendar_web'],
        ['duo-to-family', 'mail', 'duo', 'offer_26_sep_duo_family_mail_web'],
        ['duo-to-family', 'drive', 'duo', 'offer_26_sep_duo_family_drive_web'],
        ['family-monthly-to-yearly', 'mail', 'family', 'offer_26_sep_family_family12_mail_web'],
        ['family-monthly-to-yearly', 'drive', 'family', 'offer_26_sep_family_family12_drive_web'],
    ] as const)('%s in %s on %s emits %s', (key, app, currentPlan, expected) => {
        expect(offers[key].getRef?.(app, currentPlan)).toBe(expected);
    });

    it('gives every offer a distinct ID and feature code', () => {
        const ids = Object.values(offers).map(({ ID }) => ID);
        const featureCodes = Object.values(offers).map(({ featureCode }) => featureCode);

        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(featureCodes).size).toBe(featureCodes.length);
    });
});
