import { PLANS } from '@proton/payments';
import type { PaymentsContextType } from '@proton/payments/ui';
import type { SizeUnits } from '@proton/shared/lib/helpers/humanSize';
import humanSize from '@proton/shared/lib/helpers/humanSize';

const getHumanReadableSpace = (space: number | undefined, unit?: SizeUnits) => {
    if (!space) {
        return undefined;
    }
    return humanSize({ bytes: space, fraction: 0, unit, unitOptions: { max: 'TB' } });
};

export const getMaxSpaceMap = (payments: PaymentsContextType): Partial<Record<PLANS, string | undefined>> => ({
    [PLANS.MAIL]: getHumanReadableSpace(payments.plansMap[PLANS.MAIL]?.MaxSpace),
    [PLANS.DRIVE]: getHumanReadableSpace(payments.plansMap[PLANS.DRIVE]?.MaxSpace),
    [PLANS.PASS]: getHumanReadableSpace(payments.plansMap[PLANS.PASS]?.MaxSpace),
    [PLANS.VPN2024]: getHumanReadableSpace(payments.plansMap[PLANS.VPN2024]?.MaxSpace),
    [PLANS.BUNDLE]: getHumanReadableSpace(payments.plansMap[PLANS.BUNDLE]?.MaxSpace),
    [PLANS.DUO]: getHumanReadableSpace(payments.plansMap[PLANS.DUO]?.MaxSpace, 'TB'),
    [PLANS.FAMILY]: getHumanReadableSpace(payments.plansMap[PLANS.FAMILY]?.MaxSpace),
    [PLANS.PASS_FAMILY]: getHumanReadableSpace(payments.plansMap[PLANS.PASS_FAMILY]?.MaxSpace),
});
