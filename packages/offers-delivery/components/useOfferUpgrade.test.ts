import { renderHook } from '@testing-library/react';

import { useConfig } from '@proton/app-context/useConfig';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useOptionalSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { APPS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { CYCLE, PLANS } from '@proton/shared/lib/payments/constants';

import { useOfferUpgrade } from './useOfferUpgrade';

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: vi.fn() }));
vi.mock('@proton/components/components/link/useSettingsLink', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/containers/desktop/useHasInboxDesktopInAppPayments', () => ({
    useHasInboxDesktopInAppPayments: () => false,
}));
vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext', () => ({
    useOptionalSubscriptionModal: vi.fn(),
}));

const mockUseConfig = vi.mocked(useConfig);
const mockUseSettingsLink = vi.mocked(useSettingsLink);
const mockUseOptionalSubscriptionModal = vi.mocked(useOptionalSubscriptionModal);

const openSubscriptionModal = vi.fn();
const goToSettingsLink = vi.fn();

const setup = (appName: string, component = UPSELL_COMPONENT.BUTTON) => {
    mockUseConfig.mockReturnValue({ APP_NAME: appName } as ReturnType<typeof useConfig>);
    mockUseSettingsLink.mockReturnValue(goToSettingsLink);
    mockUseOptionalSubscriptionModal.mockReturnValue([openSubscriptionModal, false] as unknown as ReturnType<
        typeof useOptionalSubscriptionModal
    >);
    return renderHook(() => useOfferUpgrade(component)).result.current;
};

describe('useOfferUpgrade', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        [APPS.PROTONMAIL, 'upsell_mail-button-offers-delivery'],
        [APPS.PROTONDRIVE, 'upsell_drive-button-offers-delivery'],
        [APPS.PROTONVPN_SETTINGS, 'upsell_vpn-button-offers-delivery'],
    ])('opens plan selection in %s tagged %s', (appName, upsellRef) => {
        setup(appName)(null);

        expect(openSubscriptionModal).toHaveBeenCalledWith({
            mode: 'upsell-modal',
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            upsellRef,
        });
        expect(goToSettingsLink).not.toHaveBeenCalled();
    });

    it.each([
        [UPSELL_COMPONENT.BANNER, 'upsell_mail-banner-offers-delivery'],
        [UPSELL_COMPONENT.MODAL, 'upsell_mail-modal-offers-delivery'],
    ])('tags the %s surface with its own upsell ref', (component, upsellRef) => {
        setup(APPS.PROTONMAIL, component)(null);

        expect(openSubscriptionModal).toHaveBeenCalledWith(expect.objectContaining({ upsellRef }));
    });

    it('opens checkout with the campaign plan, cycle and coupon', () => {
        setup(APPS.PROTONMAIL)({
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            coupon: 'BLACKFRIDAY',
            disableCycleSelector: true,
            disablePlanSelector: false,
            trackingReference: undefined,
        });

        expect(openSubscriptionModal).toHaveBeenCalledWith({
            mode: 'upsell-modal',
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            coupon: 'BLACKFRIDAY',
            disableCycleSelector: true,
            disablePlanSelection: false,
            upsellRef: 'upsell_mail-button-offers-delivery',
        });
    });

    it("tags the subscription modal with the campaign's TrackingReference when it has one", () => {
        setup(APPS.PROTONMAIL)({
            plan: undefined,
            cycle: undefined,
            coupon: null,
            disableCycleSelector: false,
            disablePlanSelector: false,
            trackingReference: 'bf2026-mail-modal',
        });

        expect(openSubscriptionModal).toHaveBeenCalledWith(expect.objectContaining({ upsellRef: 'bf2026-mail-modal' }));
    });

    it('sends apps without in-app payments to the dashboard', () => {
        setup(APPS.PROTONDOCS)(null);

        expect(goToSettingsLink).toHaveBeenCalledWith('/dashboard');
        expect(openSubscriptionModal).not.toHaveBeenCalled();
    });
});
