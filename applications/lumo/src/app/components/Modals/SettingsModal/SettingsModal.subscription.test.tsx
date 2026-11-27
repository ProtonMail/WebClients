import type { AnchorHTMLAttributes } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getOrgPermissions } from '@proton/account/userPermissions';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { ModalPositionsProvider } from '@proton/components/components/modalTwo/modalPositions';
import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import type { CataloguedPlan } from '@proton/payments/testing/prodCatalogGrantsForTesting';
import {
    prodCatalogGrantsForTesting,
    toOrganizationEntitlement,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { User } from '@proton/shared/lib/interfaces/User';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { LumoPlanProvider } from '../../../providers/LumoPlanProvider';
import type * as LumoTheme from '../../../providers/LumoThemeProvider';
import type * as UserAgent from '../../../util/userAgent';
import { getNativeAppInfo } from '../../../util/userAgent';
import SettingsModal from './SettingsModal';

vi.mock('@proton/account/allSubscriptions/hooks', () => ({ useAllSubscriptions: vi.fn() }));
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({ useEntitlementChecksForOrgAndUser: vi.fn() }));
vi.mock('@proton/account/member/hook', () => ({ useMember: () => [undefined, false] }));
vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: vi.fn() }));
vi.mock('@proton/account/subscription/hooks', () => ({ useSubscription: vi.fn() }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/account/userPermissions/hooks', () => ({ useUserPermissions: vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ DATE_VERSION: '' }) }));
vi.mock('@proton/components/components/link/SettingsLink', async () => {
    const { forwardRef } = await import('react');
    return {
        default: forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { path: string }>(
            ({ path, children, ...props }, ref) => (
                <a {...props} href={path} ref={ref}>
                    {children}
                </a>
            )
        ),
    };
});
vi.mock('../../../hooks/useGuestChatHandler', () => ({ useGuestChatHandler: () => ({ isGuest: false }) }));
vi.mock('../../../providers/LumoThemeProvider', async (importOriginal) => ({
    ...(await importOriginal<typeof LumoTheme>()),
    useLumoTheme: () => ({ theme: 'light' }),
}));
vi.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ apiKeyManagement: true }) }));
vi.mock('../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
vi.mock('../../Composer/hooks/useNativeComposerVisibilityApi', () => ({ useNativeComposerVisibilityApi: () => {} }));
vi.mock('../../../util/userAgent', async (importOriginal) => ({
    ...(await importOriginal<typeof UserAgent>()),
    getNativeAppInfo: vi.fn(),
}));

const lumoGrants = [EntitlementName.FlagsLumo, EntitlementName.MaxLumoSeats, EntitlementName.LumoApi];
const catalog = buildEntitlementCatalog(
    {
        ...prodCatalogGrantsForTesting,
        [PLANS.BUNDLE_BIZ_2025]: [...prodCatalogGrantsForTesting[PLANS.BUNDLE_BIZ_2025], ...lumoGrants],
        [PLANS.LUMO_BUSINESS]: [...prodCatalogGrantsForTesting[PLANS.LUMO_BUSINESS], ...lumoGrants],
    },
    { [ADDON_NAMES.LUMO_DRIVE_BUSINESS]: lumoGrants }
);

interface Account {
    plan?: CataloguedPlan;
    role?: USER_ROLES;
    hasSeat?: boolean;
    driveLumoAddon?: boolean;
    external?: SubscriptionPlatform;
    nativePlatform?: 'ios' | 'android';
}

const mockBillingPermissions = (ready: boolean, canUpdate: boolean) => {
    vi.mocked(useUserPermissions).mockReturnValue([
        {
            permissions: ready ? getOrgPermissions([], canUpdate) : null,
            Permissions: [],
            Roles: [],
            ShowAdminRolesUI: false,
            role: USER_ROLES.ADMIN_ROLE,
            isLegacyPermissionModel: false,
        },
        false,
    ]);
};

const mockAccount = ({ plan, role, hasSeat, driveLumoAddon, external, nativePlatform }: Account) => {
    const user = formatUser({
        DisplayName: 'Test account',
        Name: 'test-account',
        Email: 'test@example.test',
        Role: role ?? (plan ? USER_ROLES.ADMIN_ROLE : USER_ROLES.FREE_ROLE),
        Subscribed: Number(!!plan),
        NumLumo: Number(!!hasSeat),
    } as User);
    const planGrants = catalog.Plans.find(({ Name }) => Name === plan)?.Entitlements ?? [];
    const addOnGrants = driveLumoAddon ? catalog.Addons[0].Entitlements : [];
    const grants = [...planGrants, ...addOnGrants];
    const organization = plan
        ? ({
              PlanName: plan,
              IsBusiness: grants.some(({ Name }) => Name === EntitlementName.Business),
              IsSubsidiary: false,
              Settings: {},
          } as OrganizationExtended)
        : undefined;
    const subscriptions =
        plan && !user.isMember
            ? [
                  buildSubscription(driveLumoAddon ? { [plan]: 1, [ADDON_NAMES.LUMO_DRIVE_BUSINESS]: 1 } : plan, {
                      External: external ?? SubscriptionPlatform.Default,
                  }),
              ]
            : [];

    vi.mocked(useUser).mockReturnValue([user, false]);
    vi.mocked(useOrganization).mockReturnValue([organization, false]);
    vi.mocked(useSubscription).mockReturnValue([
        subscriptions[0] ?? (FREE_SUBSCRIPTION as unknown as Subscription),
        false,
    ]);
    vi.mocked(useAllSubscriptions).mockReturnValue([subscriptions, false]);
    vi.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        createEntitlementResolverForOrgAndUser({
            entitlementCatalog: catalog,
            entitlements: makeEntitlements(grants.map(toOrganizationEntitlement)),
            subscriptions,
            user,
            organization,
        }),
        false,
    ]);
    mockBillingPermissions(true, user.isAdmin);
    vi.mocked(getNativeAppInfo).mockReturnValue(nativePlatform ? { version: '2.1.1', platform: nativePlatform } : null);
};

const settings = () => (
    <>
        {/* SCSS imports are mocked, so restore the dialog's display rule. */}
        <style>{'.modal-two-dialog { display: flex; }'}</style>
        <MemoryRouter>
            <ModalPositionsProvider>
                <LumoPlanProvider>
                    <SettingsModal open />
                </LumoPlanProvider>
            </ModalPositionsProvider>
        </MemoryRouter>
    </>
);

const profile = () => within(screen.getByRole('button', { name: /Test account/ }));
const subscription = () => within(screen.getByRole('region', { name: 'Subscription' }));
const manage = 'Manage subscription';
const credits = 'Add API credits';
const add = 'Add Lumo Professional';
const upgrade = 'Get Lumo Plus';
const actionNames = [manage, credits, add, upgrade];
const member = USER_ROLES.MEMBER_ROLE;

interface Scenario extends Account {
    name: string;
    badges: string[];
    card?: [title: string, summary: string, description?: string];
    actions?: string[];
}

const scenarios: Scenario[] = [
    {
        name: 'Lumo Professional admin',
        plan: PLANS.LUMO_BUSINESS,
        hasSeat: true,
        badges: ['Lumo Professional'],
        card: ['Lumo Professional', 'You manage this plan for your organization'],
        actions: [manage, credits],
    },
    {
        name: 'Lumo Professional member',
        plan: PLANS.LUMO_BUSINESS,
        role: member,
        hasSeat: true,
        badges: ['Lumo Professional'],
        card: ['Lumo Professional', 'Managed by your organization'],
    },
    {
        name: 'Workspace Premium admin',
        plan: PLANS.BUNDLE_BIZ_2025,
        hasSeat: true,
        badges: ['Workspace Premium'],
        card: ['Lumo, included in Proton Workspace Premium', 'You manage this plan for your organization'],
        actions: [manage, credits],
    },
    {
        name: 'Workspace Premium member with a seat',
        plan: PLANS.BUNDLE_BIZ_2025,
        role: member,
        hasSeat: true,
        badges: ['Workspace Premium'],
        card: ['Lumo, included in Proton Workspace Premium', 'Managed by your organization'],
    },
    {
        name: 'Workspace Premium member without a seat',
        plan: PLANS.BUNDLE_BIZ_2025,
        role: member,
        badges: ['Workspace Premium'],
        card: [
            'Lumo Free',
            'Your organization already has Lumo',
            "Ask your organization's admin to assign you a seat.",
        ],
    },
    {
        name: 'Lumo Plus via Apple App Store',
        plan: PLANS.LUMO,
        external: SubscriptionPlatform.iOS,
        hasSeat: true,
        badges: ['Lumo Plus'],
        card: ['Lumo Plus', 'Bought on Apple App Store. Manage or cancel it there.'],
    },
    {
        name: 'Lumo Plus via Google Play',
        plan: PLANS.LUMO,
        external: SubscriptionPlatform.Android,
        hasSeat: true,
        badges: ['Lumo Plus'],
        card: ['Lumo Plus', 'Bought on Google Play. Manage or cancel it there.'],
    },
    { name: 'Lumo Plus via web', plan: PLANS.LUMO, hasSeat: true, badges: ['Lumo Plus'] },
    { name: 'Free', badges: [], actions: [upgrade] },
    {
        name: 'Drive Professional admin with the Lumo add-on',
        plan: PLANS.DRIVE_BUSINESS,
        driveLumoAddon: true,
        hasSeat: true,
        badges: ['Drive Professional'],
        card: ['Lumo Professional', 'You manage this add-on for your organization'],
        actions: [manage, credits],
    },
    {
        name: 'Drive Professional admin without Lumo',
        plan: PLANS.DRIVE_BUSINESS,
        badges: ['Drive Professional'],
        card: ['Lumo Free', "Proton Drive Professional doesn't include Lumo"],
        actions: [add],
    },
    {
        name: 'Drive Professional member without Lumo',
        plan: PLANS.DRIVE_BUSINESS,
        role: member,
        badges: ['Drive Professional'],
        card: ['Lumo Free', "Proton Drive Professional doesn't include Lumo"],
    },
    { name: 'Visionary', plan: PLANS.VISIONARY, hasSeat: true, badges: ['Lumo Plus', 'Visionary'] },
    { name: 'Family admin without Lumo', plan: PLANS.FAMILY, badges: [], actions: [upgrade] },
    {
        name: 'Family member without Lumo',
        plan: PLANS.FAMILY,
        role: member,
        badges: ['Proton Family'],
        card: [
            'Lumo Free',
            "Proton Family doesn't include a Lumo plan",
            'To get a Lumo plan, please ask your family admin.',
        ],
    },
    {
        name: 'Duo member without Lumo',
        plan: PLANS.DUO,
        role: member,
        badges: ['Proton Duo'],
        card: [
            'Lumo Free',
            "Proton Duo doesn't include a Lumo plan",
            'To get a Lumo plan, please ask your family admin.',
        ],
    },
    {
        name: 'Family member with a seat',
        plan: PLANS.FAMILY,
        role: member,
        hasSeat: true,
        badges: ['Proton Family'],
        card: ['Lumo, included in Proton Family', "Part of your family's plan"],
    },
];

it.each(scenarios)('shows the correct account settings for $name', ({ badges, card, actions = [], ...account }) => {
    mockAccount(account);
    render(settings());

    for (const badge of badges) {
        expect(profile().getByText(badge)).toBeVisible();
    }
    expect(profile().queryByText('Proton Business')).not.toBeInTheDocument();
    if (card) {
        const section = subscription();
        for (const text of card) {
            if (text) {
                expect(section.getByText(text)).toBeVisible();
            }
        }
    } else {
        expect(screen.queryByRole('region', { name: 'Subscription' })).not.toBeInTheDocument();
    }
    for (const action of actionNames) {
        const role = action === upgrade ? 'button' : 'link';
        if (actions.includes(action)) {
            expect(screen.getByRole(role, { name: action })).toBeVisible();
        } else {
            expect(screen.queryByRole(role, { name: action })).not.toBeInTheDocument();
        }
    }
});

it.each([
    { platform: 'ios', external: SubscriptionPlatform.iOS, canManage: true },
    { platform: 'android', external: SubscriptionPlatform.Android, canManage: true },
    { platform: 'ios', external: SubscriptionPlatform.Android, canManage: false },
    { platform: 'android', external: SubscriptionPlatform.iOS, canManage: false },
] as const)(
    'gates native subscription management on $platform for provider $external',
    ({ platform, external, canManage }) => {
        mockAccount({ plan: PLANS.LUMO, hasSeat: true, external, nativePlatform: platform });
        render(settings());

        const button = screen.queryByRole('link', { name: 'Manage Subscription' });
        if (canManage) {
            expect(button).toBeVisible();
        } else {
            expect(button).not.toBeInTheDocument();
        }
    }
);

it('shows placeholders until billing permissions resolve and skips the temporary business badge', () => {
    mockAccount({ plan: PLANS.LUMO_BUSINESS, hasSeat: true });
    mockBillingPermissions(false, false);
    const { rerender } = render(settings());

    expect(screen.getByRole('status')).toHaveTextContent('Loading subscription details');
    expect(profile().getByTestId('skeleton-loader')).toBeInTheDocument();
    expect(screen.queryByText('Lumo Business')).not.toBeInTheDocument();
    expect(screen.queryByText('Managed by your organization')).not.toBeInTheDocument();

    mockBillingPermissions(true, true);
    rerender(settings());

    expect(profile().getByText('Lumo Professional')).toBeVisible();
    expect(subscription().getByRole('link', { name: manage })).toBeVisible();
    expect(screen.queryByText('Loading subscription details')).not.toBeInTheDocument();
});
