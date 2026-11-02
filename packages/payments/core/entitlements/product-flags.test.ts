import { EntitlementName } from './entitlement-names';
import { getProductFlagsOtherThan } from './product-flags';

describe('getProductFlagsOtherThan', () => {
    it('lists every product flag without arguments', () => {
        expect(getProductFlagsOtherThan()).toEqual(
            Object.values(EntitlementName).filter((name) => name.startsWith('flags-'))
        );
    });

    it('drops the given product flags and keeps the others', () => {
        const flags = getProductFlagsOtherThan(EntitlementName.FlagsLumo, EntitlementName.FlagsInbox);

        expect(flags).toEqual(expect.arrayContaining([EntitlementName.FlagsDrive, EntitlementName.FlagsVpn]));
        expect(flags).not.toContain(EntitlementName.FlagsLumo);
        expect(flags).not.toContain(EntitlementName.FlagsInbox);
    });

    it('returns no entitlement that is not a product flag', () => {
        expect(getProductFlagsOtherThan()).not.toContain(EntitlementName.MultiUser);
    });
});
