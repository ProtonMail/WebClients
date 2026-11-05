import { render, screen } from '@testing-library/react';

import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { GuardBanner, type GuardBannerTelemetry, getGuardBannerTelemetry } from './GuardBanner';

jest.mock('@proton/payments/telemetry/telemetry', () => ({
    checkoutTelemetry: {
        reportGuardShown: jest.fn(),
    },
}));

const guardResult: GuardError[] = [
    { Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'raw 1' },
    { Code: GUARD_ERROR_CODES.TOO_FEW_DOMAINS, Message: 'raw 2' },
];

const checkResult = {
    GuardResult: guardResult,
    requestData: { Plans: { [PLANS.MAIL]: 1 }, Currency: 'EUR', Cycle: CYCLE.YEARLY },
} as unknown as SubscriptionEstimation;

const telemetryOf = (result: SubscriptionEstimation): GuardBannerTelemetry => ({
    checkResult: result,
    subscriptions: undefined,
});

beforeEach(() => jest.mocked(checkoutTelemetry.reportGuardShown).mockClear());

describe('getGuardBannerTelemetry', () => {
    it('takes codes and selection from the check result, dropping backend messages', () => {
        expect(getGuardBannerTelemetry(telemetryOf(checkResult))).toEqual({
            guardCodes: [GUARD_ERROR_CODES.TOO_FEW_MEMBERS, GUARD_ERROR_CODES.TOO_FEW_DOMAINS],
            selectedPlanIDs: { [PLANS.MAIL]: 1 },
            selectedCycle: CYCLE.YEARLY,
            subscriptions: [],
        });
    });

    it('lists the primary subscription followed by its secondary ones', () => {
        const secondary = buildSubscription(PLANS.VPN2024);
        const primary = buildSubscription(PLANS.MAIL, { SecondarySubscriptions: [secondary] });

        expect(getGuardBannerTelemetry({ checkResult, subscriptions: primary }).subscriptions).toEqual([
            primary,
            secondary,
        ]);
    });

    it('reports every paid subscription of a list', () => {
        const mail = buildSubscription(PLANS.MAIL);
        const vpn = buildSubscription(PLANS.VPN2024);

        expect(getGuardBannerTelemetry({ checkResult, subscriptions: [mail, vpn] }).subscriptions).toEqual([mail, vpn]);
    });

    it('reports no subscriptions for free users', () => {
        expect(getGuardBannerTelemetry({ checkResult, subscriptions: FREE_SUBSCRIPTION }).subscriptions).toEqual([]);
    });

    it('has no codes when the check result has no guard errors', () => {
        expect(getGuardBannerTelemetry(telemetryOf({ ...checkResult, GuardResult: [] })).guardCodes).toEqual([]);
    });
});

describe('GuardBanner telemetry', () => {
    it('reports once while the same codes stay shown', () => {
        const { rerender } = render(<GuardBanner errors={guardResult} telemetry={telemetryOf(checkResult)} />);
        rerender(<GuardBanner errors={guardResult} telemetry={telemetryOf(checkResult)} />);

        expect(checkoutTelemetry.reportGuardShown).toHaveBeenCalledTimes(1);
        expect(checkoutTelemetry.reportGuardShown).toHaveBeenCalledWith(
            getGuardBannerTelemetry(telemetryOf(checkResult))
        );
    });

    it('reports again when the shown codes change', () => {
        const other = { ...checkResult, GuardResult: [guardResult[1]] };
        const { rerender } = render(<GuardBanner errors={guardResult} telemetry={telemetryOf(checkResult)} />);
        rerender(<GuardBanner errors={other.GuardResult} telemetry={telemetryOf(other)} />);

        expect(checkoutTelemetry.reportGuardShown).toHaveBeenCalledTimes(2);
        expect(checkoutTelemetry.reportGuardShown).toHaveBeenLastCalledWith(
            expect.objectContaining({ guardCodes: [GUARD_ERROR_CODES.TOO_FEW_DOMAINS] })
        );
    });

    it('does not report without codes or when telemetry is opted out', () => {
        const { rerender } = render(
            <GuardBanner errors={[]} telemetry={telemetryOf({ ...checkResult, GuardResult: [] })} />
        );
        rerender(<GuardBanner errors={guardResult} telemetry={undefined as GuardBannerTelemetry | undefined} />);

        expect(checkoutTelemetry.reportGuardShown).not.toHaveBeenCalled();
    });
});

describe('GuardBanner', () => {
    it('renders every guard error in one view', () => {
        render(
            <GuardBanner
                telemetry={undefined}
                errors={[
                    { Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'raw 1' },
                    { Code: GUARD_ERROR_CODES.TOO_FEW_DOMAINS, Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(2);
        expect(status.textContent).toContain('Plan switch is incompatible for the following reasons:');
        expect(status.textContent).not.toContain('raw 1');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('shows a single generic message when no error is mapped', () => {
        render(
            <GuardBanner
                telemetry={undefined}
                errors={[
                    { Code: 9999991 as GuardError['Code'], Message: 'raw 1' },
                    { Code: 9999992 as GuardError['Code'], Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(1);
        expect(status.textContent).toContain('can’t be completed');
        expect(status.textContent).not.toContain('incompatible for the following reasons');
        expect(status.textContent).not.toContain('raw 1');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('drops unmapped errors when at least one error is mapped', () => {
        render(
            <GuardBanner
                telemetry={undefined}
                errors={[
                    { Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'raw 1' },
                    { Code: 9999999 as GuardError['Code'], Message: 'raw 2' },
                ]}
            />
        );

        const status = screen.getByTestId('banner');

        expect(status.querySelectorAll('li')).toHaveLength(1);
        expect(status.textContent).not.toContain('can’t be completed');
        expect(status.textContent).not.toContain('raw 2');
    });

    it('announces the banner to assistive technology and does not rely on colour alone', () => {
        const { container } = render(
            <GuardBanner telemetry={undefined} errors={[{ Code: 9999999 as GuardError['Code'], Message: 'x' }]} />
        );
        const status = screen.getByTestId('banner');

        expect(status).toHaveAttribute('role', 'alert');
        expect(container.querySelector('svg')).toBeTruthy();
        expect(status.textContent).toContain('can’t be completed');
    });

    it('renders nothing when there are no errors', () => {
        const { container } = render(<GuardBanner telemetry={undefined} errors={[]} />);

        expect(container.firstChild).toBeNull();
    });

    it('does not open a modal', () => {
        render(
            <GuardBanner telemetry={undefined} errors={[{ Code: GUARD_ERROR_CODES.TOO_FEW_MEMBERS, Message: 'x' }]} />
        );

        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});
