import { useEffect, useState } from 'react';
import { format, fromUnixTime, subDays } from 'date-fns';
import { c } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import emptyMailboxSvg from '@proton/styles/assets/img/placeholders/empty-mailbox.svg';
import {
    Button,
    Loader,
    ReferralFeaturesList,
    useSubscription,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
} from '@proton/components';
import useSubscriptionModal from '../../payments/subscription/useSubscriptionModal';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';

const ReferralModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [formattedEndDate, setFormattedEndDate] = useState('');
    const [subscription, loadingSubscription] = useSubscription();
    const [showSubscriptionModalCallback, loadingSubscriptionModal] = useSubscriptionModal();

    useEffect(() => {
        if (subscription?.PeriodEnd && isTrial(subscription)) {
            const endDate = fromUnixTime(subscription.PeriodEnd);
            const willEndSoon = new Date() >= subDays(endDate, 3);

            // Should be in trial and 3 days before end
            // TODO : Check if has already saw this modal
            setShowModal(willEndSoon);
            setFormattedEndDate(format(endDate, 'P', { locale: dateLocale }));
        }
    }, [subscription?.PeriodEnd]);

    return (
        <ModalTwo open={showModal}>
            <ModalTwoHeader
                title={
                    // translator: complete sentence would be : Your free trial ends soon, on 01/01/2022
                    c('Title').t`Your free trial ends soon, on ${formattedEndDate}`
                }
            />
            <ModalTwoContent>
                {loadingSubscription || loadingSubscriptionModal ? (
                    <Loader />
                ) : (
                    <>
                        <p>{c('Info')
                            .t`Upgrade today and keep access to the privacy-first Mail and Calendar solution for your everyday communications needs.`}</p>
                        <div className="flex flex-justify-center">
                            <img src={emptyMailboxSvg} alt="Mailbox image" />
                        </div>
                        <ReferralFeaturesList />
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                {/** TODO */}
                <Button onClick={() => showSubscriptionModalCallback(PLANS.PLUS)} shape="outline">{c('Info')
                    .t`Other options`}</Button>
                <Button
                    color="norm"
                    loading={loadingSubscriptionModal}
                    disabled={loadingSubscriptionModal}
                    onClick={() => showSubscriptionModalCallback(PLANS.PLUS, SUBSCRIPTION_STEPS.CHECKOUT)}
                >{c('Info').t`Continue with plus`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReferralModal;
