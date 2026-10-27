import { buildEntitlementCatalog, catalogEntry } from '../../testing/buildEntitlementCatalog';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
    prodCatalogGrants,
} from '../../testing/prodCatalogGrants';
import { regularAdmin } from '../../testing/regularAdmin';
import { usersWhoCannotReadSubscriptions } from '../../testing/usersWhoCannotReadSubscriptions';
import { PLANS } from '../constants';
import type { Subscription } from '../subscription/interface';
import { entitlementChecksForOrgAndUser } from './checks';
import { getEntitlementsPerPlan } from './entitlement-grants';
import { EntitlementName } from './entitlement-names';
import {
    type Entitlement,
    type EntitlementCatalog,
    EntitlementMergeStrategy,
    type EntitlementResolveConditions,
    type EntitlementResolverForSelection,
    EntitlementScope,
    EntitlementType,
    type ResolvedEntitlement,
} from './interface';
import type { Entitlements } from './interface';
import { createEntitlementResolverForOrgAndUser, createEntitlementResolverForSelection } from './resolver';

/**
 * Parity gate on quantity semantics between the two resolvers: `createEntitlementResolverForSelection`
 * and `createEntitlementResolverForOrgAndUser`.
 *
 * `Quantity: 0` means not granted everywhere: `hasEntitlement` reads `> 0`, and `checkConditions`
 * drops zero-quantity entries before evaluating `includes` / `excludes`, so a present-but-zero entry
 * neither satisfies an `includes` nor trips an `excludes`.
 *
 * The two resolvers only agree while their inputs agree. `hasEntitlement` on the org/user resolver
 * reads the backend-granted quantities, while its `hasMatchingSubscription` evaluates conditions against the catalog
 * fold of the user's subscriptions — a different data source. The last test pins that divergence down
 * in both directions.
 */
describe('entitlement resolver parity on quantity semantics', () => {
    const planName = PLANS.MAIL_PRO;
    const subscription = { Plans: [{ Name: planName, Quantity: 1 }] } as unknown as Subscription;
    const nameOutsideThePlan = EntitlementName.FlagsVpn;
    const entitlementCatalog = buildEntitlementCatalog({
        [planName]: [
            EntitlementName.Business,
            EntitlementName.MultiUser,
            catalogEntry(EntitlementName.MaxSpace, {
                Type: EntitlementType.Value,
                Quantity: 51200,
                Scope: EntitlementScope.MemberAssignable,
                MergeStrategy: EntitlementMergeStrategy.Sum,
            }),
        ],
    });

    const includesOnly = (name: EntitlementName): EntitlementResolveConditions => ({ includes: [name] });

    /**
     * `checkConditions` rejects excludes-only conditions outright, so the exclusion is anchored on an entitlement the
     * plan is known to grant. The anchor always passes, leaving the `excludes` clause as the only thing under test.
     */
    const anchoredExcludes = (name: EntitlementName): EntitlementResolveConditions => ({
        includes: [EntitlementName.MultiUser],
        excludes: [name],
    });

    const asEntitlements = (organizationEntitlements: Entitlement[]): Entitlements => ({
        OrganizationEntitlements: organizationEntitlements,
        UserEntitlements: [],
        MemberEntitlements: [],
    });

    const catalogGrants = getEntitlementsPerPlan(entitlementCatalog, { [planName]: 1 });
    const allEntitlementNames = Object.values(EntitlementName);

    const asOrganizationEntitlement = ({ name, quantity, scope }: ResolvedEntitlement): Entitlement => ({
        Name: name,
        Type: EntitlementType.Value,
        Quantity: quantity,
        Scope: scope,
    });

    const mirrorGrantsIntoBackend = (grants: ResolvedEntitlement[]) =>
        asEntitlements(grants.map(asOrganizationEntitlement));

    const catalogWithQuantity = (name: EntitlementName, quantity: number): EntitlementCatalog => ({
        ...entitlementCatalog,
        Plans: entitlementCatalog.Plans.map((plan) =>
            plan.Name !== planName
                ? plan
                : {
                      ...plan,
                      Entitlements: plan.Entitlements.map((entry) =>
                          entry.Name === name ? { ...entry, Quantity: quantity } : entry
                      ),
                  }
        ),
    });

    const perName = <T>(read: (name: EntitlementName) => T) =>
        Object.fromEntries(allEntitlementNames.map((name) => [name, read(name)]));

    const grantedPerName = (resolver: EntitlementResolverForSelection) =>
        perName((name) => resolver.hasEntitlement(name));

    const matchesPerName = (
        resolver: EntitlementResolverForSelection,
        toConditions: (name: EntitlementName) => EntitlementResolveConditions
    ) => perName((name) => resolver.hasMatchingSubscription(toConditions(name)));

    const expectedGranted = perName((name) => catalogGrants.some((grant) => grant.name === name && grant.quantity > 0));
    const expectedNotGranted = perName(
        (name) => !catalogGrants.some((grant) => grant.name === name && grant.quantity > 0)
    );

    const resolvers = {
        selection: createEntitlementResolverForSelection(entitlementCatalog, planName),
        orgAndUser: createEntitlementResolverForOrgAndUser({
            entitlementCatalog,
            entitlements: mirrorGrantsIntoBackend(catalogGrants),
            subscriptions: [subscription],
            ...regularAdmin,
        }),
    };

    it('folds the plan into the concrete quantities the parity cases rely on', () => {
        expect(catalogGrants).toContainEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Organization,
        });
        expect(catalogGrants).toContainEqual({
            name: EntitlementName.MaxSpace,
            quantity: 51200,
            scope: EntitlementScope.MemberAssignable,
        });
        expect(catalogGrants).toContainEqual({
            name: EntitlementName.MultiUser,
            quantity: 1,
            scope: EntitlementScope.Organization,
        });
        expect(catalogGrants.filter(({ quantity }) => quantity <= 0)).toEqual([]);
        expect(catalogGrants.map(({ name }) => name)).not.toContain(nameOutsideThePlan);
    });

    it.each(Object.entries(resolvers))(
        '%s resolver agrees with the folded quantities on hasEntitlement, includes and excludes',
        (_label, resolver) => {
            expect(grantedPerName(resolver)).toEqual(expectedGranted);
            expect(matchesPerName(resolver, includesOnly)).toEqual(expectedGranted);
            expect(matchesPerName(resolver, anchoredExcludes)).toEqual(expectedNotGranted);

            expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(51200);
            expect(resolver.quantityTotal(nameOutsideThePlan)).toBe(0);
            expect(resolver.isB2B).toBe(true);
            expect(resolver.isMultiUser).toBe(true);
            expect(resolver.isB2cMultiUser).toBe(false);
        }
    );

    it('treats a present-but-zero entitlement exactly like an absent one in both resolvers', () => {
        const catalog = catalogWithQuantity(EntitlementName.Business, 0);
        const grants = getEntitlementsPerPlan(catalog, { [planName]: 1 });
        expect(grants).toContainEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });

        const selection = createEntitlementResolverForSelection(catalog, planName);
        const orgAndUser = createEntitlementResolverForOrgAndUser({
            entitlementCatalog: catalog,
            entitlements: mirrorGrantsIntoBackend(grants),
            subscriptions: [subscription],
            ...regularAdmin,
        });
        const businessAbsent = createEntitlementResolverForOrgAndUser({
            entitlementCatalog: catalog,
            entitlements: mirrorGrantsIntoBackend(grants.filter(({ name }) => name !== EntitlementName.Business)),
            subscriptions: [subscription],
            ...regularAdmin,
        });

        for (const resolver of [selection, orgAndUser, businessAbsent]) {
            expect(resolver.hasEntitlement(EntitlementName.Business)).toBe(false);
            expect(resolver.isB2B).toBe(false);
            expect(resolver.quantityTotal(EntitlementName.Business)).toBe(0);
            expect(resolver.hasMatchingSubscription(includesOnly(EntitlementName.Business))).toBe(false);
            expect(resolver.hasMatchingSubscription(includesOnly(EntitlementName.MultiUser))).toBe(true);
            expect(resolver.isB2cMultiUser).toBe(true);
        }

        expect(orgAndUser.resolveTotal(EntitlementName.Business)).toEqual(
            businessAbsent.resolveTotal(EntitlementName.Business)
        );
        expect(orgAndUser.resolveForMember(EntitlementName.Business)).toEqual(
            businessAbsent.resolveForMember(EntitlementName.Business)
        );
    });

    it('lets backend quantities and the catalog fold disagree, in both directions', () => {
        const businessRevoked = createEntitlementResolverForOrgAndUser({
            entitlementCatalog,
            entitlements: mirrorGrantsIntoBackend(
                catalogGrants.map((grant) =>
                    grant.name === EntitlementName.Business ? { ...grant, quantity: 0 } : grant
                )
            ),
            subscriptions: [subscription],
            ...regularAdmin,
        });

        expect(businessRevoked.hasEntitlement(EntitlementName.Business)).toBe(false);
        expect(businessRevoked.isB2B).toBe(false);
        // `hasMatchingSubscription` reads the catalog fold of the subscription, so the revoked quantity is invisible to it
        expect(businessRevoked.hasMatchingSubscription(includesOnly(EntitlementName.Business))).toBe(true);
        expect(businessRevoked.findSubscriptionsMatching(includesOnly(EntitlementName.Business))).toEqual({
            result: true,
            subscriptions: [subscription],
        });
        // the org is therefore reported as neither business nor B2C multi-user
        expect(businessRevoked.isB2cMultiUser).toBe(false);

        const vpnGrantedOutsideTheCatalog = createEntitlementResolverForOrgAndUser({
            entitlementCatalog,
            entitlements: asEntitlements([
                ...catalogGrants.map(asOrganizationEntitlement),
                {
                    Name: nameOutsideThePlan,
                    Type: EntitlementType.Switch,
                    Quantity: 1,
                    Scope: EntitlementScope.Organization,
                },
            ]),
            subscriptions: [subscription],
            ...regularAdmin,
        });

        expect(vpnGrantedOutsideTheCatalog.quantityTotal(nameOutsideThePlan)).toBe(1);
        expect(vpnGrantedOutsideTheCatalog.hasVpn).toBe(true);
        expect(vpnGrantedOutsideTheCatalog.hasMatchingSubscription(includesOnly(nameOutsideThePlan))).toBe(false);
        expect(vpnGrantedOutsideTheCatalog.hasMatchingSubscription(anchoredExcludes(nameOutsideThePlan))).toBe(true);
    });
});

describe('entitlement checks give users who cannot read subscriptions the same answers as the admin', () => {
    const checkNames = Object.keys(entitlementChecksForOrgAndUser) as (keyof typeof entitlementChecksForOrgAndUser)[];
    const cataloguedPlans = Object.keys(prodCatalogGrants) as CataloguedPlan[];

    const answersPerCheck = (resolver: ReturnType<typeof buildOrgAndUserEntitlementChecks>) =>
        Object.fromEntries(checkNames.map((name) => [name, resolver[name]]));

    const adminAnswers = (plan: CataloguedPlan) =>
        answersPerCheck(buildOrgAndUserEntitlementChecks({ subscriptionPlans: [plan] }));

    const cases: ({ plan: CataloguedPlan } & (typeof usersWhoCannotReadSubscriptions)[number])[] =
        cataloguedPlans.flatMap((plan) => usersWhoCannotReadSubscriptions.map((userType) => ({ plan, ...userType })));

    it.each(cases)(
        'answers every check for $case of a $plan organization like its admin',
        ({ plan, user, organization }) => {
            const answers = answersPerCheck(
                buildOrgAndUserEntitlementChecks({
                    subscriptionPlans: [plan],
                    user,
                    organization,
                })
            );

            expect(answers).toEqual(adminAnswers(plan));
        }
    );

    it('compares answers that depend on the subscription', () => {
        expect(adminAnswers(PLANS.PASS_BUSINESS)).toMatchObject({ isPassB2B: true, isVpnB2B: false });
        expect(adminAnswers(PLANS.FAMILY)).toMatchObject({ isB2cMultiUser: true, isPassB2B: false });
        expect(adminAnswers(PLANS.VPN_BUSINESS)).toMatchObject({ isVpnB2B: true, hasDedicatedIpsOrIsVpnB2B: true });
    });
});
