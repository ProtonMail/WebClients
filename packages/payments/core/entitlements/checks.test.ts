import { buildEntitlementCatalog } from '../../testing/buildEntitlementCatalog';
import { buildSubscription } from '../../testing/buildSubscription';
import { PLANS } from '../constants';
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

describe('Pass business upgrade checks', () => {
    const passCatalog = buildEntitlementCatalog({
        [PLANS.PASS_PRO]: [EntitlementName.Business, EntitlementName.FlagsPass],
        [PLANS.PASS_BUSINESS]: [
            EntitlementName.Business,
            EntitlementName.FlagsPass,
            EntitlementName.ActivityMonitorPass,
            EntitlementName.OrganizationPolicy,
            EntitlementName.Groups,
        ],
        [PLANS.VPN_BUSINESS]: [EntitlementName.Business, EntitlementName.OrganizationPolicy, EntitlementName.Groups],
        [PLANS.PASS]: [EntitlementName.FlagsPass],
    });

    const checksFor = (plan: PLANS) => createEntitlementResolverForSelection(passCatalog, buildSubscription(plan));

    it('flags activity monitor and groups as upgrades for passpro2024', () => {
        const checks = checksFor(PLANS.PASS_PRO);

        expect(checks.isPassB2BWithoutActivityMonitor).toBe(true);
        expect(checks.isPassB2BWithoutGroups).toBe(true);
    });

    it('flags no upgrade for passbiz2024', () => {
        const checks = checksFor(PLANS.PASS_BUSINESS);

        expect(checks.isPassB2BWithoutActivityMonitor).toBe(false);
        expect(checks.isPassB2BWithoutGroups).toBe(false);
    });

    it.each([PLANS.VPN_BUSINESS, PLANS.PASS])('flags no upgrade for non Pass business plan %s', (plan) => {
        const checks = checksFor(plan);

        expect(checks.isPassB2BWithoutActivityMonitor).toBe(false);
        expect(checks.isPassB2BWithoutGroups).toBe(false);
    });
});

describe('hasOrganizationPolicy', () => {
    const organizationPolicyCatalog = buildEntitlementCatalog({
        [PLANS.PASS_BUSINESS]: [
            EntitlementName.Business,
            EntitlementName.FlagsPass,
            EntitlementName.OrganizationPolicy,
        ],
        [PLANS.PASS_PRO]: [EntitlementName.Business, EntitlementName.FlagsPass],
    });

    it('returns true for passbiz2024, which grants organization policy', () => {
        expect(
            createEntitlementResolverForSelection(organizationPolicyCatalog, PLANS.PASS_BUSINESS).hasOrganizationPolicy
        ).toBe(true);
    });

    it('returns false for passpro2024, which does not grant organization policy', () => {
        expect(
            createEntitlementResolverForSelection(organizationPolicyCatalog, PLANS.PASS_PRO).hasOrganizationPolicy
        ).toBe(false);
    });
});

describe('hasExternalManagedMembers', () => {
    const externalMembersCatalog = buildEntitlementCatalog({
        [PLANS.VPN_PRO]: [EntitlementName.Business, EntitlementName.ExternalManagedMembers],
        [PLANS.MAIL_PRO]: [EntitlementName.Business],
    });

    it('returns true for a plan that grants external managed members', () => {
        expect(
            createEntitlementResolverForSelection(externalMembersCatalog, PLANS.VPN_PRO).hasExternalManagedMembers
        ).toBe(true);
    });

    it('returns false for a plan without external managed members', () => {
        expect(
            createEntitlementResolverForSelection(externalMembersCatalog, PLANS.MAIL_PRO).hasExternalManagedMembers
        ).toBe(false);
    });
});
