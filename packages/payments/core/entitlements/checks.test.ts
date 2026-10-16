import { buildEntitlementCatalog } from '../../testing/buildEntitlementCatalog';
import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, PLANS } from '../constants';
import { EntitlementName } from './entitlement-names';
import { createEntitlementResolverForSelection } from './resolver';

const allCoreProducts = [
    EntitlementName.FlagsDrive,
    EntitlementName.FlagsInbox,
    EntitlementName.FlagsPass,
    EntitlementName.FlagsVpn,
];

const entitlementCatalog = buildEntitlementCatalog({
    [PLANS.BUNDLE]: allCoreProducts,
    [PLANS.DUO]: [...allCoreProducts, EntitlementName.MultiUser],
    [PLANS.FAMILY]: [...allCoreProducts, EntitlementName.MultiUser],
    [PLANS.VISIONARY]: [...allCoreProducts, EntitlementName.FlagsLumo, EntitlementName.MultiUser],
    [PLANS.MAIL]: [EntitlementName.FlagsInbox],
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
    [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
    [PLANS.PASS]: [EntitlementName.FlagsPass],
    [PLANS.LUMO]: [EntitlementName.FlagsLumo],
    [PLANS.MEET]: [EntitlementName.FlagsMeet],
    [PLANS.BUNDLE_PRO_2024]: [...allCoreProducts, EntitlementName.Business, EntitlementName.MultiUser],
    [PLANS.BUNDLE_BIZ_2025]: [...allCoreProducts, EntitlementName.Business, EntitlementName.MultiUser],
});

const scribeCatalog = buildEntitlementCatalog(
    { [PLANS.MAIL_PRO]: [EntitlementName.FlagsInbox, EntitlementName.Business] },
    { [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: [EntitlementName.MaxScribe] }
);

const hasAllCoreProductsB2C = (plan: PLANS) =>
    createEntitlementResolverForSelection(entitlementCatalog, buildSubscription(plan)).hasAllCoreProductsB2C;

describe('hasAllCoreProductsB2C', () => {
    it.each([PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY])('returns true for B2C bundle %s', (plan) => {
        expect(hasAllCoreProductsB2C(plan)).toBe(true);
    });

    it.each([PLANS.MAIL, PLANS.VPN2024, PLANS.DRIVE, PLANS.PASS, PLANS.LUMO, PLANS.MEET])(
        'returns false for plus plan %s',
        (plan) => {
            expect(hasAllCoreProductsB2C(plan)).toBe(false);
        }
    );

    it.each([PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025])('returns false for B2B bundle %s', (plan) => {
        expect(hasAllCoreProductsB2C(plan)).toBe(false);
    });
});

describe('hasScribe', () => {
    it('returns true when the selection includes a Scribe addon', () => {
        const selection = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 };

        expect(createEntitlementResolverForSelection(scribeCatalog, selection).hasScribe).toBe(true);
    });

    it('returns false when the selection has no Scribe addon', () => {
        expect(createEntitlementResolverForSelection(scribeCatalog, PLANS.MAIL_PRO).hasScribe).toBe(false);
    });
});

describe('isPassB2B', () => {
    const passBusinessCatalog = buildEntitlementCatalog({
        [PLANS.PASS_BUSINESS]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.PASS_PRO]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.VPN_PASS_BUNDLE_BUSINESS]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.BUNDLE_BIZ_2025]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.VPN_BUSINESS]: [EntitlementName.Business],
        [PLANS.MAIL_PRO]: [EntitlementName.Business],
        [PLANS.PASS]: [EntitlementName.FlagsPass],
        [PLANS.DUO]: [EntitlementName.FlagsPass],
    });

    const isPassB2B = (plan: PLANS) =>
        createEntitlementResolverForSelection(passBusinessCatalog, buildSubscription(plan)).isPassB2B;

    it.each([
        PLANS.PASS_BUSINESS,
        PLANS.PASS_PRO,
        PLANS.VPN_PASS_BUNDLE_BUSINESS,
        PLANS.BUNDLE_PRO_2024,
        PLANS.BUNDLE_BIZ_2025,
    ])('returns true for business plan with Pass %s', (plan) => {
        expect(isPassB2B(plan)).toBe(true);
    });

    it.each([PLANS.VPN_BUSINESS, PLANS.MAIL_PRO])('returns false for business plan without Pass %s', (plan) => {
        expect(isPassB2B(plan)).toBe(false);
    });

    it.each([PLANS.PASS, PLANS.DUO])('returns false for consumer plan with Pass %s', (plan) => {
        expect(isPassB2B(plan)).toBe(false);
    });
});
