import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { ApiDocsPage } from './ApiDocsPage';

vi.mock('@proton/account/entitlementCatalog/hooks');
vi.mock('../../hooks/useLumoFlags');
vi.mock('../../hooks/useLumoPlan');
vi.mock('../../providers/IsGuestProvider');
vi.mock('../../services/apiUsageDebugStore', () => ({
    useDebugApiAccessDenied: () => false,
    useDebugApiOrganizationMemberView: () => false,
    useDebugApiOrganizationView: () => false,
}));
vi.mock('../../layouts/LumoLayout', () => ({
    LumoLayoutWithDrawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/Composer/hooks/useNativeComposerVisibilityApi', () => ({
    useNativeComposerVisibilityApi: () => undefined,
}));
vi.mock('../../components/Guest/SignInLink', () => ({ SignInButton: () => <button>Sign in</button> }));
vi.mock('./apiModels', () => ({ fetchApiModels: () => new Promise(() => {}) }));
vi.mock('../api-keys/ApiKeysPanel', () => ({ __esModule: true, default: () => <div>API keys panel</div> }));
vi.mock('../api-keys/ApiUsagePanel', () => ({ ApiUsagePanel: () => <div>API usage panel</div> }));

const API_NOT_INCLUDED = "Your plan doesn't include API access.";
const ASK_FOR_SEAT = 'Ask your organization administrator to assign a Lumo seat to your account to use the API.';
const BOTH_TABS = ['#api-keys', '#api-usage'] as const;

const renderTab = (
    hash: (typeof BOTH_TABS)[number],
    {
        isGuest = false,
        hasLumoApi = false,
        hasLumoPlus = false,
        isOrgAdmin = false,
        canShowTalkToAdminLumoUpsell = false,
        isEntitlementsLoading = false,
    }: {
        isGuest?: boolean;
        hasLumoApi?: boolean;
        hasLumoPlus?: boolean;
        isOrgAdmin?: boolean;
        canShowTalkToAdminLumoUpsell?: boolean;
        isEntitlementsLoading?: boolean;
    }
) => {
    (useLumoFlags as Mock).mockReturnValue({ apiKeyManagement: true });
    (useIsGuest as Mock).mockReturnValue(isGuest);
    (useLumoPlan as Mock).mockReturnValue({
        hasLumoPlus,
        isLumoPlanLoading: false,
        canShowTalkToAdminLumoUpsell,
        isOrgAdmin,
        userIsMember: canShowTalkToAdminLumoUpsell,
    });
    (useEntitlementChecksForOrgAndUser as Mock).mockReturnValue([{ hasLumoApi }, isEntitlementsLoading]);
    render(
        <MemoryRouter initialEntries={[`/docs/api${hash}`]}>
            <ApiDocsPage />
        </MemoryRouter>
    );
};

describe('ApiDocsPage access', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each(BOTH_TABS)('tells a seated user whose plan has no API access on %s', (hash) => {
        renderTab(hash, { hasLumoPlus: true });

        expect(screen.getByText(API_NOT_INCLUDED)).toBeVisible();
        expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it.each(BOTH_TABS)('tells an admin whose organization has no API access on %s', (hash) => {
        renderTab(hash, { isOrgAdmin: true });
        expect(screen.getByText(API_NOT_INCLUDED)).toBeVisible();
    });

    it('tells a consumer user without a seat or API access', () => {
        renderTab('#api-keys', {});
        expect(screen.getByText(API_NOT_INCLUDED)).toBeVisible();
    });

    it('shows keys to a seated user with API access', () => {
        renderTab('#api-keys', { hasLumoApi: true, hasLumoPlus: true });
        expect(screen.getByText('API keys panel')).toBeVisible();
    });

    it.each([
        ['#api-keys', 'API keys panel'],
        ['#api-usage', 'API usage panel'],
    ] as const)('lets an admin with API access and no seat open %s', (hash, panel) => {
        renderTab(hash, { hasLumoApi: true, isOrgAdmin: true });
        expect(screen.getByText(panel)).toBeVisible();
    });

    it.each(BOTH_TABS)('asks a member without a seat to request one on %s', (hash) => {
        renderTab(hash, { hasLumoApi: true, canShowTalkToAdminLumoUpsell: true });
        expect(screen.getByText(ASK_FOR_SEAT)).toBeVisible();
    });

    it('tells a member without a seat when the organization has no API access', () => {
        renderTab('#api-keys', { canShowTalkToAdminLumoUpsell: true });
        expect(screen.getByText(API_NOT_INCLUDED)).toBeVisible();
    });

    it.each(BOTH_TABS)('waits for the entitlements before deciding on %s', (hash) => {
        renderTab(hash, { isEntitlementsLoading: true });

        expect(screen.getByText('Loading…')).toBeVisible();
        expect(screen.queryByText(API_NOT_INCLUDED)).not.toBeInTheDocument();
    });

    it('contains a failed entitlements request inside the page', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        (useEntitlementChecksForOrgAndUser as Mock).mockImplementation(() => {
            throw new Error('entitlements request failed');
        });
        (useLumoFlags as Mock).mockReturnValue({ apiKeyManagement: true });
        (useIsGuest as Mock).mockReturnValue(false);
        (useLumoPlan as Mock).mockReturnValue({ isLumoPlanLoading: false });

        render(
            <MemoryRouter initialEntries={['/docs/api#api-keys']}>
                <ApiDocsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Something went wrong')).toBeVisible();
    });

    it.each(BOTH_TABS)('asks a guest to sign in without loading account data on %s', (hash) => {
        renderTab(hash, { isGuest: true });

        expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
        expect(useEntitlementChecksForOrgAndUser).not.toHaveBeenCalled();
    });
});
