import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

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
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import type { FreePlanDefault, PLANS, Plan } from '@proton/payments';
import { FREE_PLAN, getPlansMap } from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import chronometerSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-chronometer.svg';
import hourglassSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-hourglass.svg';
import clsx from '@proton/utils/clsx';

const getTrialInfo = (planTitle: string | undefined) => {
    if (!planTitle) {
        return [];
    }

    const cancelAnytimeTitle = <b>{c('Onboarding Trial').t`Cancel anytime before then.`}</b>;
    const cancelAnytimeDescription = c('Onboarding Trial')
        .jt`You’ll be able to use ${planTitle} until the trial ends, free of charge.`;
    const cancelAnytimeArray = [cancelAnytimeTitle, ' ', cancelAnytimeDescription];

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a pro-rata refund.
    const refundTitle = <b>{c('Onboarding Trial').jt`Once your full subscription starts...`}</b>;

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a prorated refund.
    const refundDescription = c('Onboarding Trial').t`You can still cancel within 30 days and get a prorated refund.`;
    const refundArray = [refundTitle, ' ', refundDescription];

    return [
        {
            id: 'cancelAnytime',
            description: cancelAnytimeArray,
            img: hourglassSvg,
        },
        {
            id: 'refund',
            description: refundArray,
            img: chronometerSvg,
        },
    ];
};

const TrialFeature = ({ description, imgSrc }: { description: ReactNode; imgSrc: string }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];
    return (
        <div className="flex flex-row gap-4 items-center">
            <img
                className={clsx('w-custom', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={imgSrc}
                alt=""
            />
            <div className="flex-1 flex gap-0">
                <p className="m-0 text-weak">{description}</p>
            </div>
        </div>
    );
};

const FeatureList = () => {
    const [subscription] = useSubscription();

    const api = useApi();
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
            <p>{c('Info').jt`You'll also lose access to ${boldPlanTitle} features:`}</p>
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

const CancelTrialModal = ({ onClose, ...rest }: ModalStateProps) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [user] = useUser();

    const [step, setStep] = useState<'info' | 'cancel' | 'canceled'>('info');

    const trialStartedOn = subscription?.PeriodStart;
    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = subscription?.Plans?.[0]?.Title;

    const trialDurationExists = trialStartedOn && trialEndsOn;
    const trialDurationFormatted = trialDurationExists
        ? differenceInDays(fromUnixTime(trialEndsOn), fromUnixTime(trialStartedOn))
        : 0;

    const trialInfo = useMemo(() => getTrialInfo(planTitle), [planTitle]);

    if (!subscription || !organization || !user) {
        return null;
    }

    const boldPlanTitle = <span className="text-bold">{planTitle}</span>;
    const boldProtonFree = <span className="text-bold">{`${BRAND_NAME} ${FREE_PLAN.Title}`}</span>;
    const boldEndDate = (
        <span className="text-bold">
            <Time>{trialEndsOn}</Time>
        </span>
    );

    if (step === 'info') {
        return (
            <ModalTwo onClose={onClose} {...rest}>
                <ModalTwoHeader
                    title={c('Title').ngettext(
                        msgid`Your free trial ends in ${trialDurationFormatted} day`,
                        `Your free trial ends in ${trialDurationFormatted} days`,
                        trialDurationFormatted
                    )}
                />
                <ModalTwoContent>
                    <p>{c('Onboarding Trial').jt`Your full ${planTitle} subscription starts on ${boldEndDate}.`}</p>
                    <div className="flex flex-column gap-y-4 mt-12">
                        {trialInfo.map(({ id, description, img }) => (
                            <TrialFeature key={id} description={description} imgSrc={img} />
                        ))}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={() => setStep('cancel')}>{c('Action').t`Cancel subscription`}</Button>
                    <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    if (step === 'cancel') {
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
                    <Button onClick={onClose}>{c('Action').t`Keep subscription`}</Button>
                    <Button color="danger" onClick={() => setStep('canceled')}>{c('Action')
                        .t`Cancel subscription`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    return (
        <ModalTwo onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Subscription canceled`} />
            <ModalTwoContent>
                <p>{c('Info').jt`You’ll lose access to ${boldPlanTitle} on ${boldEndDate}.`}</p>
                <p>{c('Info')
                    .t`You’ll still be able to view your own account data, but all user accounts will be removed from your organization.`}</p>
                <p>{c('Info').t`If you change your mind, you can subscribe again at any time. Sorry to see you go!`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelTrialModal;
