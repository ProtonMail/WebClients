import { renderHook } from '@testing-library/react';

import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import type { CheckoutCondensedAddonsParams } from './getCheckoutCondensedAddons';
import { useCheckoutCondensedAddons } from './useCheckoutCondensedAddons';

const mockUseFlagsStatus = jest.fn();
jest.mock('@proton/unleash/proxy', () => ({
    useFlagsStatus: () => mockUseFlagsStatus(),
}));

const mockUseVariant = jest.fn();
jest.mock('@proton/unleash/useVariant', () => ({
    useVariant: () => mockUseVariant(),
}));

type Args = Omit<CheckoutCondensedAddonsParams, 'flagsReady' | 'variant'>;

const eligibleArgs: Args = {
    selectedPlanIDs: { [PLANS.BUNDLE]: 1 },
    latestSubscription: FREE_SUBSCRIPTION,
    user: { canPay: true },
    isLiteApp: false,
};

let reportSeen: jest.SpyInstance;

const setup = ({
    flagsReady = true,
    variant = { name: 'condensed' },
    args = eligibleArgs,
}: { flagsReady?: boolean; variant?: { name?: string }; args?: Args } = {}) => {
    mockUseFlagsStatus.mockReturnValue({ flagsReady });
    mockUseVariant.mockReturnValue(variant);
    return renderHook((props) => useCheckoutCondensedAddons(props), { initialProps: args });
};

beforeEach(() => {
    reportSeen = jest
        .spyOn(checkoutTelemetry.subscriptionContainer, 'reportCheckoutCondensedAddonsExperimentSeen')
        .mockImplementation(() => {});
});

afterEach(() => {
    reportSeen.mockRestore();
});

describe('useCheckoutCondensedAddons', () => {
    it.each(['condensed', 'control'])('reports the %s variant once for an eligible checkout', (variantName) => {
        setup({ variant: { name: variantName } });

        expect(reportSeen).toHaveBeenCalledTimes(1);
        expect(reportSeen).toHaveBeenCalledWith({ variant: variantName });
    });

    it('returns true only for the condensed variant', () => {
        expect(setup({ variant: { name: 'condensed' } }).result.current).toBe(true);
        expect(setup({ variant: { name: 'control' } }).result.current).toBe(false);
    });

    it('does not report again when the checkout re-renders', () => {
        const { rerender } = setup();
        rerender({ ...eligibleArgs });
        rerender({ ...eligibleArgs, selectedPlanIDs: { [PLANS.BUNDLE]: 1 } });

        expect(reportSeen).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['upgrading to Duo', { ...eligibleArgs, selectedPlanIDs: { [PLANS.DUO]: 1 } }],
        ['already on Family', { ...eligibleArgs, latestSubscription: buildSubscription({ [PLANS.FAMILY]: 1 }) }],
        ['already on Lumo Plus', { ...eligibleArgs, latestSubscription: buildSubscription({ [PLANS.LUMO]: 1 }) }],
        ['already on a B2B plan', { ...eligibleArgs, latestSubscription: buildSubscription({ [PLANS.VPN_PRO]: 1 }) }],
        ['unable to pay', { ...eligibleArgs, user: { canPay: false } }],
        ['in the lite app', { ...eligibleArgs, isLiteApp: true }],
    ])('does not report for an ineligible checkout (%s)', (_, args: Args) => {
        setup({ args });

        expect(reportSeen).not.toHaveBeenCalled();
    });

    it.each([
        ['the flag is off', 'disabled'],
        ['the variant is missing', undefined],
        ['the variant is unknown', 'Condensed'],
    ])('does not report when %s', (_, variantName) => {
        setup({ variant: { name: variantName } });

        expect(reportSeen).not.toHaveBeenCalled();
    });

    it('waits for the flags before reporting', () => {
        const { rerender } = setup({ flagsReady: false });
        expect(reportSeen).not.toHaveBeenCalled();

        mockUseFlagsStatus.mockReturnValue({ flagsReady: true });
        rerender({ ...eligibleArgs });

        expect(reportSeen).toHaveBeenCalledTimes(1);
    });

    it('reports once the user switches from an ineligible plan to Unlimited in the same checkout', () => {
        const { rerender } = setup({ args: { ...eligibleArgs, selectedPlanIDs: { [PLANS.DUO]: 1 } } });
        expect(reportSeen).not.toHaveBeenCalled();

        rerender({ ...eligibleArgs });

        expect(reportSeen).toHaveBeenCalledTimes(1);
        expect(reportSeen).toHaveBeenCalledWith({ variant: 'condensed' });
    });
});
