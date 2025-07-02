import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import Time from '@proton/components/components/time/Time';
import { getShortPlan } from '@proton/components/containers/payments/features/plan';
import useApi from '@proton/components/hooks/useApi';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import type { FreePlanDefault, PLANS, Plan } from '@proton/payments';
import { FREE_PLAN, getPlansMap } from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const FeatureList = () => {
    const api = useApi();
    const [subscription] = useSubscription();

    const silentApi = getSilentApi(api);
    const getPlans = useGetPlans();

    const [vpnServers, loadingVPNServers] = useVPNServersCount();
    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [plans, setPlans] = useState<Plan[] | undefined>(undefined);
    const [freePlan, setFreePlan] = useState<FreePlanDefault | undefined>(undefined);

    useEffect(() => {
        void getPlans({ api: silentApi }).then(({ plans, freePlan }) => {
            setPlans(plans);
            setFreePlan(freePlan);
        });
    }, []);

    if (loadingCurrency || loadingVPNServers || !plans || !freePlan || !subscription) {
        return null;
    }

    const planName = subscription.Plans[0]?.Name;
    const plansMap = getPlansMap(plans, currency, true);
    const shortPlan = getShortPlan(planName as PLANS, plansMap, { vpnServers, freePlan });
    const features = shortPlan?.features.map((feature) => feature.text) ?? [];

    if (features.length === 0) {
        return null;
    }

    const planTitle = subscription?.Plans[0]?.Title;
    const boldPlanTitle = <span className="text-bold">{planTitle}</span>;

    return (
        <>
            <p>{c('Info').jt`You’ll also lose access to ${boldPlanTitle} features:`}</p>
            <StripedList alternate="odd" className="mt-0">
                {features.map((feature, i) => {
                    return (
                        /* eslint-disable-next-line react/no-array-index-key */
                        <StripedItem key={i} left={<Icon name="cross-big" className="color-weak" />}>
                            {feature}
                        </StripedItem>
                    );
                })}
            </StripedList>
        </>
    );
};

export interface CancelTrialModalProps extends ModalStateProps {
    onConfirm: () => void;
}

const CancelTrialModal = ({ onConfirm, onClose, ...rest }: CancelTrialModalProps) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [user] = useUser();

    const trialEndsOn = subscription?.PeriodEnd;

    if (!subscription || !organization || !user) {
        return null;
    }

    const boldProtonFree = <span className="text-bold">{`${BRAND_NAME} ${FREE_PLAN.Title}`}</span>;

    const boldCancelDate = (
        <span className="text-bold">
            {'('}
            <Time>{trialEndsOn}</Time>
            {')'}
        </span>
    );

    return (
        <ModalTwo onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Cancel subscription?`} />
            <ModalTwoContent>
                <p>{c('Info')
                    .jt`At the end of your trial ${boldCancelDate}, you’ll be downgraded to ${boldProtonFree}. All user accounts will be removed from your organization.`}</p>
                <FeatureList />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={onConfirm}>{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelTrialModal;
