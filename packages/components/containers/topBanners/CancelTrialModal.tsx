import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import { Banner } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import Time from '@proton/components/components/time/Time';
import { FREE_PLAN } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import ModalTwo from '../../components/modalTwo/Modal';
import ModalTwoContent from '../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../components/modalTwo/ModalHeader';

const CancelTrialModal = ({ onClose, ...rest }: ModalStateProps) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [user] = useUser();

    const [step, setStep] = useState<'cancel' | 'canceled'>('cancel');

    const [planTitle, setPlanTitle] = useState<string | undefined>(undefined);
    const [organizationName, setOrganizationName] = useState<string | undefined>(undefined);

    // these might change after cancelling
    const currentPlanTitle = subscription?.Plans[0]?.Title;
    const currentOrganizationName = organization?.Name;

    useEffect(() => {
        if (subscription) {
            setPlanTitle((previousTitle) => previousTitle ?? currentPlanTitle);
        }
    }, [currentPlanTitle]);

    useEffect(() => {
        if (organization) {
            setOrganizationName((previousOrganizationName) => previousOrganizationName ?? currentOrganizationName);
        }
    }, [currentOrganizationName]);

    if (subscription === undefined || organization === undefined || user === undefined) {
        return null;
    }

    const boldPlanTitle = <span className="text-bold">{planTitle}</span>;
    const boldProtonFree = <span className="text-bold">{`${BRAND_NAME} ${FREE_PLAN.Title}`}</span>;

    if (step === 'cancel') {
        const subscriptionEnd = subscription.PeriodEnd;
        const boldCancelDate = (
            <span className="text-bold">
                <Time>{subscriptionEnd}</Time>
            </span>
        );

        const features = [1, 2, 3, 4, 5].map((feature) => `Feature ${feature}`);

        return (
            <ModalTwo onClose={onClose} {...rest}>
                <ModalTwoHeader title={c('Title').t`Cancel subscription?`} />
                <ModalTwoContent>
                    <p>{c('Info')
                        .jt`If you cancel, you will lose access to ${boldPlanTitle} immediately, and you will be downgraded to the ${boldProtonFree} plan. If your usage exceeds free plan limits, you may experience restricted access to product features and your data.`}</p>
                    <p className="mb-2">{c('Info')
                        .jt`To continue enjoying ${boldPlanTitle} for free until ${boldCancelDate}, don't cancel.`}</p>
                    <Href href={getStaticURL('')}>{c('Link').t`Learn more`}</Href>
                    <p>{c('Info').jt`What you give up when you cancel ${boldPlanTitle}:`}</p>
                    <StripedList alternate="odd" className="mt-0">
                        {features.map((text) => (
                            <StripedItem key={text} left={<Icon name="cross-big" className="color-weak" />}>
                                {text}
                            </StripedItem>
                        ))}
                    </StripedList>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose}>{c('Action').t`Keep subscription`}</Button>
                    <Button color="danger" onClick={() => setStep('canceled')}>{c('Action')
                        .t`Cancel subscription`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    const boldUserEmail = <span className="text-bold">{user.Email}</span>;
    const boldOrganizationName = <span className="text-bold">{organizationName}</span>;

    return (
        <ModalTwo onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Subscription canceled`} />
            <ModalTwoContent>
                <p>{c('Info')
                    .jt`Your free trial of ${boldPlanTitle} has been canceled, and your account ${boldUserEmail} has been downgraded to ${boldProtonFree}.`}</p>
                <Banner variant="norm-outline" icon={<Icon name="info-circle" />} largeRadius={true}>
                    {c('Info')
                        .jt`Your organization ${boldOrganizationName} is disabled and all its user seats have been removed.`}
                </Banner>
                <p>{c('Info')
                    .t`You can still access all your account's data. You can subscribe again at any time to continue enjoying all of our features.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelTrialModal;
