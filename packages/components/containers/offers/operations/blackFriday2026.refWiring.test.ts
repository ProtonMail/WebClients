import { APPS } from '@proton/shared/lib/constants';

import { getOfferProduct } from '../helpers/getOfferProduct';
import { withResolvedRefs } from '../helpers/withResolvedRefs';
import { configuration as duoToFamily } from './blackFriday2026DuoToFamily/configuration';
import { configuration as freeToUnlimited } from './blackFriday2026FreeToUnlimited/configuration';
import { configuration as plusToUnlimited } from './blackFriday2026PlusToUnlimited/configuration';
import { configuration as unlimitedToDuo } from './blackFriday2026UnlimitedToDuo/configuration';

const configurations = [
    { name: 'free-to-unlimited', configuration: freeToUnlimited },
    { name: 'plus-to-unlimited', configuration: plusToUnlimited },
    { name: 'unlimited-to-duo', configuration: unlimitedToDuo },
    { name: 'duo-to-family', configuration: duoToFamily },
];

/**
 * Guards the wiring rather than the templates. `getRef` lives on the entry in blackFriday2026offers.ts, but
 * it only has any effect if each operation's configuration.ts destructures it *and* passes it onto the
 * deal. Miss either step and withResolvedRefs silently returns the config untouched, so every offer
 * falls back to its static `ref` and the app/plan segments never vary.
 *
 * That exact bug shipped once: the templates were unit-tested in isolation and passed, while the
 * feature did nothing in the app.
 */
describe('blackFriday2026 ref wiring', () => {
    it.each(configurations)('$name passes getRef through to its deal', ({ configuration }) => {
        expect(configuration.deals[0].getRef).toBeDefined();
    });

    it.each(configurations)('$name resolves a real ref through withResolvedRefs', ({ configuration }) => {
        const resolved = withResolvedRefs(configuration, APPS.PROTONDRIVE, '/');

        // The static fallback is always the mail ref, so a drive ref proves resolution actually ran.
        expect(resolved.deals[0].ref).toMatch(/^offer_bf_26_drive_/);
        expect(resolved.deals[0].ref).not.toBe(configuration.deals[0].ref);
    });

    it('tracks Inbox, Drive and Pass entry separately, with Calendar counted as Inbox', () => {
        const refFor = (appName: Parameters<typeof withResolvedRefs>[1], pathname = '/') => {
            return withResolvedRefs(freeToUnlimited, appName, pathname).deals[0].ref;
        };

        expect(refFor(APPS.PROTONMAIL)).toBe('offer_bf_26_mail_free_unlimited_web');
        expect(refFor(APPS.PROTONCALENDAR)).toBe('offer_bf_26_mail_free_unlimited_web');
        expect(refFor(APPS.PROTONDRIVE)).toBe('offer_bf_26_drive_free_unlimited_web');

        expect(refFor(APPS.PROTONACCOUNT, '/mail/dashboard')).toBe('offer_bf_26_mail_free_unlimited_web');
        expect(refFor(APPS.PROTONACCOUNT, '/calendar/dashboard')).toBe('offer_bf_26_mail_free_unlimited_web');
        expect(refFor(APPS.PROTONACCOUNT, '/drive/dashboard')).toBe('offer_bf_26_drive_free_unlimited_web');

        expect(refFor(APPS.PROTONACCOUNT, '/pass/dashboard')).toBe('offer_bf_26_pass_free_unlimited_web');
    });

    it.each(configurations)('$name returns feature bullets after resolution', ({ configuration }) => {
        const resolved = withResolvedRefs(configuration, APPS.PROTONDRIVE, '/');

        expect(resolved.deals[0].features?.('drive')?.length).toBeGreaterThan(0);
    });

    it('leads the app list with Drive or Pass when the user is in them, and with Mail everywhere else', () => {
        const appListFor = (appName: Parameters<typeof withResolvedRefs>[1], pathname = '/') => {
            const resolved = withResolvedRefs(freeToUnlimited, appName, pathname);

            return resolved.deals[0].features?.(getOfferProduct(appName, pathname))?.[0].name;
        };

        expect(appListFor(APPS.PROTONDRIVE)).toBe('Premium Drive, Mail, Pass, and VPN');
        expect(appListFor(APPS.PROTONACCOUNT, '/pass/dashboard')).toBe('Premium Pass, Mail, Drive, and VPN');
        expect(appListFor(APPS.PROTONMAIL)).toBe('Premium Mail, Pass, Drive, and VPN');

        // Calendar is not in the list, so it falls back to the Mail order.
        expect(appListFor(APPS.PROTONCALENDAR)).toBe('Premium Mail, Pass, Drive, and VPN');
    });

    it('does not lead Family copy with Calendar, which the plan copy omits', () => {
        const familyAppListFor = (appName: Parameters<typeof withResolvedRefs>[1], pathname = '/') => {
            const resolved = withResolvedRefs(duoToFamily, appName, pathname);

            return resolved.deals[0].features?.(getOfferProduct(appName, pathname))?.[0].name;
        };

        expect(familyAppListFor(APPS.PROTONDRIVE)).toBe('Premium Drive, Mail, Pass, VPN');
        expect(familyAppListFor(APPS.PROTONMAIL)).toBe('Premium Mail, Pass, Drive, VPN');

        // Calendar is not in the Family list, so it falls back rather than dropping VPN to make room.
        expect(familyAppListFor(APPS.PROTONCALENDAR)).toBe('Premium Mail, Pass, Drive, VPN');
        expect(familyAppListFor(APPS.PROTONACCOUNT, '/pass/dashboard')).toBe('Premium Mail, Pass, Drive, VPN');
    });
});
