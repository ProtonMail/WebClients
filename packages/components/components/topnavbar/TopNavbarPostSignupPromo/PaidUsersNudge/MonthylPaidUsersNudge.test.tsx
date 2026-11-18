import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useConfig } from '@proton/app-context/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import {
    APPS,
    APP_UPSELL_REF_PATH,
    DRIVE_UPSELL_PATHS,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';

import useUpsellConfig from '../../../upsell/config/useUpsellConfig';
import { MonthylPaidUsersNudge } from './MonthylPaidUsersNudge';
import { usePaidUsersNudge } from './hooks/usePaidUsersNudge';

vi.mock('./hooks/usePaidUsersNudgeTelemetry', () => ({
    usePaidUsersNudgeTelemetry: vi.fn(() => ({
        sendPaidUserNudgeReport: vi.fn(),
    })),
}));

vi.mock('./hooks/useGetPlanPriceWithCoupon', () => ({
    useGetPlanPriceWithCoupon: vi.fn(() => ({
        loading: false,
        prices: {
            yearlyPrice: 1000,
            discountedPrice: 500,
            savedAmount: 500,
        },
    })),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    __esModule: true,
    useNotifications: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('../../../upsell/config/useUpsellConfig', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        onUpgrade: vi.fn(),
        upgradePath: '/mock-upgrade-path',
    })),
    appsWithInApp: new Set(['proton-mail', 'proton-account', 'proton-calendar']),
}));

vi.mock('../../../link/useSettingsLink', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useUser: vi.fn().mockReturnValue([]),
}));

vi.mock('@proton/account/subscription/hooks', () => ({
    __esModule: true,
    useSubscription: vi.fn().mockReturnValue([]),
}));

vi.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: vi.fn(() => ({ update: vi.fn() })),
}));

vi.mock('@proton/payments-hooks/client-extensions/useAutomaticCurrency', () => ({
    __esModule: true,
    useAutomaticCurrency: vi.fn().mockReturnValue(['CHF', false]),
}));

vi.mock('./hooks/usePaidUsersNudge');
const mockedPaidUserNudge = usePaidUsersNudge as Mock;

vi.mock('@proton/app-context/useConfig');
const mockUseConfig = useConfig as Mock;

const mockUseUpsellConfig = useUpsellConfig as Mock;

describe('MonthylPaidUsersNudge', () => {
    it('Should create appropriate config for Mail', () => {
        mockUseConfig.mockReturnValue({
            APP_NAME: APPS.PROTONMAIL,
        });
        mockedPaidUserNudge.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: true,
        });

        render(<MonthylPaidUsersNudge plan={PLANS.MAIL} />);

        const planCopy = screen.getByTestId('monthly-offer:plan-copy');

        expect(planCopy).toBeInTheDocument();
        expect(planCopy.innerHTML).toContain(PLAN_NAMES.mail2022);

        expect(mockUseUpsellConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                plan: PLANS.MAIL,
                upsellRef: getUpsellRef({
                    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                    component: UPSELL_COMPONENT.MODAL,
                    feature: MAIL_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
                }),
            })
        );
    });

    it('Should create appropriate config for Drive', () => {
        mockUseConfig.mockReturnValue({
            APP_NAME: APPS.PROTONDRIVE,
        });
        mockedPaidUserNudge.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: true,
        });

        render(<MonthylPaidUsersNudge plan={PLANS.DRIVE} />);

        const planCopy = screen.getByTestId('monthly-offer:plan-copy');

        expect(planCopy).toBeInTheDocument();
        expect(planCopy.innerHTML).toContain(PLAN_NAMES.drive2022);

        expect(mockUseUpsellConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                plan: PLANS.DRIVE,
                upsellRef: getUpsellRef({
                    app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH,
                    component: UPSELL_COMPONENT.MODAL,
                    feature: DRIVE_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
                }),
            })
        );
    });

    it('Should not show the spotlight while loading', () => {
        mockUseConfig.mockReturnValue({
            APP_NAME: APPS.PROTONMAIL,
        });
        mockedPaidUserNudge.mockReturnValue({
            isEligible: true,
            isLoading: true,
            openSpotlight: true,
        });

        render(<MonthylPaidUsersNudge plan={PLANS.MAIL} />);

        const planCopy = screen.queryByTestId('monthly-offer:plan-copy');
        expect(planCopy).not.toBeInTheDocument();
    });

    it('Should not show the spotlight if spotlight is closed', () => {
        mockUseConfig.mockReturnValue({
            APP_NAME: APPS.PROTONMAIL,
        });
        mockedPaidUserNudge.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: false,
        });

        render(<MonthylPaidUsersNudge plan={PLANS.MAIL} />);

        const planCopy = screen.queryByTestId('monthly-offer:plan-copy');
        expect(planCopy).not.toBeInTheDocument();
    });
});
