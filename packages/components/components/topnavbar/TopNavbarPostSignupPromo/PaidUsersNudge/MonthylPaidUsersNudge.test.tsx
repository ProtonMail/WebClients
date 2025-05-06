import { render, screen } from '@testing-library/react';

import useUpsellConfig from '@proton/components/components/upsell/config/useUpsellConfig';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import {
    APPS,
    APP_UPSELL_REF_PATH,
    DRIVE_UPSELL_PATHS,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { MonthylPaidUsersNudge } from './MonthylPaidUsersNudge';
import { usePaidUsersNudge } from './hooks/usePaidUsersNudge';

jest.mock('./hooks/usePaidUsersNudgeTelemetry', () => ({
    usePaidUsersNudgeTelemetry: jest.fn(() => ({
        sendPaidUserNudgeReport: jest.fn(),
    })),
}));

jest.mock('./hooks/useGetPlanPriceWithCoupon', () => ({
    useGetPlanPriceWithCoupon: jest.fn(() => ({
        loading: false,
        prices: {
            yearlyPrice: 1000,
            discountedPrice: 500,
            savedAmount: 500,
        },
    })),
}));

jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    }),
}));

jest.mock('@proton/components/components/upsell/config/useUpsellConfig', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        onUpgrade: jest.fn(),
        upgradePath: '/mock-upgrade-path',
    })),
    appsWithInApp: new Set(['proton-mail', 'proton-account', 'proton-calendar']),
}));

jest.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useUser: jest.fn().mockReturnValue([]),
}));

jest.mock('@proton/account/subscription/hooks', () => ({
    __esModule: true,
    useSubscription: jest.fn().mockReturnValue([]),
}));

jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: jest.fn(() => ({ update: jest.fn() })),
}));

jest.mock('@proton/components/payments/client-extensions', () => ({
    __esModule: true,
    useAutomaticCurrency: jest.fn().mockReturnValue(['CHF', false]),
}));

jest.mock('./hooks/usePaidUsersNudge');
const mockedPaidUserNudge = usePaidUsersNudge as jest.Mock;

jest.mock('@proton/components/hooks/useConfig');
const mockUseConfig = useConfig as jest.Mock;

const mockUseUpsellConfig = useUpsellConfig as jest.Mock;

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
