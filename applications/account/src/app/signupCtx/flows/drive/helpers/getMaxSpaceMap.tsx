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

export const getDriveMaxSpaceMap = (payments: PaymentsContextType): Partial<Record<PLANS, string | undefined>> => ({
    [PLANS.FREE]: getHumanReadableSpace(payments.freePlan.MaxDriveRewardSpace),
    [PLANS.DRIVE]: getHumanReadableSpace(payments.plansMap[PLANS.DRIVE]?.MaxSpace),
    [PLANS.BUNDLE]: getHumanReadableSpace(payments.plansMap[PLANS.BUNDLE]?.MaxSpace),
    [PLANS.DUO]: getHumanReadableSpace(payments.plansMap[PLANS.DUO]?.MaxSpace, 'TB'),
    [PLANS.FAMILY]: getHumanReadableSpace(payments.plansMap[PLANS.FAMILY]?.MaxSpace),
    [PLANS.DRIVE_BUSINESS]: getHumanReadableSpace(payments.plansMap[PLANS.DRIVE_BUSINESS]?.MaxSpace),
});
