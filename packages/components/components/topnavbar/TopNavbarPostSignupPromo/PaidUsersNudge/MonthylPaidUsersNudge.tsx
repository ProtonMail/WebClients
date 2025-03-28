import { PaidUserNudgeOffer } from './components/PaidUserNudgeOffer';
import type { SupportedPlans } from './helpers/interface';
import { usePaidUsersNudge } from './hooks/usePaidUsersNudge';
import { paidConfig } from './montlyPaidUserNudgeConfig';

interface Props {
    plan: SupportedPlans;
}

export const MonthylPaidUsersNudge = ({ plan }: Props) => {
    const { openSpotlight, isLoading } = usePaidUsersNudge({ plan });

    return (
        <PaidUserNudgeOffer
            currentPlan={paidConfig[plan].currentPlan}
            offerTimestampFlag={paidConfig[plan].offerTimestampFlag}
            openSpotlight={openSpotlight}
            isLoading={isLoading}
        />
    );
};
