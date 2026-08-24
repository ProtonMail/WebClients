import { APPS } from '@proton/shared/lib/constants';

import { getSafetyReviewBackLink } from './getSafetyReviewBackLink';

const origin = window.location.origin;

describe('getSafetyReviewBackLink', () => {
    it('takes the product from the settings slug when there is one', () => {
        const backLink = getSafetyReviewBackLink(`${origin}/u/0/vpn/recovery`, APPS.PROTONACCOUNT);

        expect(backLink.appName).toBe(APPS.PROTONVPN_SETTINGS);
        expect(backLink.context).toBe('settings');
        expect(backLink.to).toBe('/vpn/recovery');
    });

    it('falls back to the app serving the review when the link has no slug', () => {
        const backLink = getSafetyReviewBackLink(`${origin}/recovery`, APPS.PROTONVPN_SETTINGS);

        expect(backLink.appName).toBe(APPS.PROTONVPN_SETTINGS);
        expect(backLink.context).toBe('settings');
        expect(backLink.to).toBe('/recovery');
    });

    it('keeps generic account settings on account', () => {
        const backLink = getSafetyReviewBackLink(`${origin}/u/0/recovery`, APPS.PROTONACCOUNT);

        expect(backLink.appName).toBe(APPS.PROTONACCOUNT);
    });

    it('falls back to its own recovery settings when there is no back link', () => {
        const backLink = getSafetyReviewBackLink('', APPS.PROTONVPN_SETTINGS);

        expect(backLink.appName).toBe(APPS.PROTONVPN_SETTINGS);
        expect(backLink.to).toBe('/recovery');
    });

    it('falls back to generic recovery settings in account when there is no back link', () => {
        const backLink = getSafetyReviewBackLink('', APPS.PROTONACCOUNT);

        expect(backLink.appName).toBe(APPS.PROTONACCOUNT);
        expect(backLink.to).toBe('/recovery');
    });

    it('ignores a back link pointing at another domain', () => {
        const backLink = getSafetyReviewBackLink('https://example.com/recovery', APPS.PROTONVPN_SETTINGS);

        expect(backLink.appName).toBe(APPS.PROTONVPN_SETTINGS);
        expect(backLink.to).toBe('/recovery');
    });
});
