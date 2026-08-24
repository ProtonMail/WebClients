import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import type { PLANS } from '@proton/payments/core/constants';
import type { FreePlanDefault, Plan } from '@proton/payments/core/plan/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlanName, getPlanTitle } from '@proton/payments/core/subscription/helpers';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import StripedItem from '../../../components/stripedList/StripedItem';
import { StripedList } from '../../../components/stripedList/StripedList';
import Time from '../../../components/time/Time';
import { useSilentApi } from '../../../hooks/useSilentApi';
import { useAutomaticCurrency } from '../../../payments/client-extensions/index';
import { getShortPlan } from '../features/plan';

const FeatureList = () => {
    const [subscription] = useSubscription();

    const silentApi = useSilentApi();
    const getPlans = useGetPlans();

    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [plans, setPlans] = useState<Plan[] | undefined>(undefined);
    const [freePlan, setFreePlan] = useState<FreePlanDefault | undefined>(undefined);

    useEffect(() => {
        void getPlans({ api: silentApi }).then(({ plans, freePlan }) => {
            setPlans(plans);
            setFreePlan(freePlan);
        });
    }, []);

    if (loadingCurrency || !plans || !freePlan || !subscription) {
        return null;
    }

    const planName = getPlanName(subscription);
    const plansMap = getPlansMap(plans, currency, true);
    const shortPlan = getShortPlan(planName as PLANS, plansMap, { freePlan });
    const features = shortPlan?.features.map((feature) => feature.text) ?? [];

    if (features.length === 0) {
        return null;
    }

    const planTitle = getPlanTitle(subscription);
    const boldPlanTitle = (
        <span className="text-bold" key="plan-title">
            {planTitle}
        </span>
    );

    return (
        <>
            <p>{c('Info').jt`You’ll also lose access to ${boldPlanTitle} features:`}</p>
            <StripedList alternate="odd" className="mt-0">
                {features.map((feature, i) => {
                    return (
                        /* eslint-disable-next-line react/no-array-index-key */
                        <StripedItem key={i} left={<IcCrossBig className="color-weak" />}>
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

    const boldProtonFree = (
        <span className="text-bold" key="proton-free-plan">{`${BRAND_NAME} ${FREE_PLAN.Title}`}</span>
    );

    const boldCancelDate = (
        <span className="text-bold" key="cancel-date">
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
