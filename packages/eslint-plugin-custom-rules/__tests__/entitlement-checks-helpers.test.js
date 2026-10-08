import fs from 'node:fs';
import path from 'node:path';

import { parseRegisteredCheckNames } from '../entitlement-checks-helpers';

describe('parseRegisteredCheckNames', () => {
    it('collects the keys of every entitlement check registry', () => {
        const names = parseRegisteredCheckNames(`
            import { EntitlementName } from './entitlement-names';

            export const entitlementChecksForSelection = {
                isB2cMultiUser: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser] }),

                /** doc comment { with a brace } */
                isBusiness: (r) => r.hasEntitlement(EntitlementName.Business),
            } satisfies Record<string, EntitlementCheckForSelection>;

            export const entitlementChecksForOrgAndUser = {
                ...entitlementChecksForSelection,

                hasSeats: (r) => r.quantityForMember(EntitlementName.MaxMembers) > 0,
            } satisfies Record<string, EntitlementCheckForOrgAndUser>;
        `);

        expect([...names]).toEqual(['isB2cMultiUser', 'isBusiness', 'hasSeats']);
    });

    it('finds nothing in a source without a registry', () => {
        expect(parseRegisteredCheckNames('export const plans = { mail2022: 1 };').size).toBe(0);
    });

    it('reads the names of the checks that exist today', () => {
        const checksSource = fs.readFileSync(
            path.resolve(__dirname, '../../payments/core/entitlements/checks.ts'),
            'utf8'
        );

        expect([...parseRegisteredCheckNames(checksSource)]).toEqual(
            expect.arrayContaining(['isBusiness', 'isMultiUser', 'isMspEligible', 'hasVpn'])
        );
    });
});
