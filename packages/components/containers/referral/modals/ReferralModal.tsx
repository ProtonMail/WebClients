import { useEffect, useState } from 'react';
import { format, fromUnixTime, subDays } from 'date-fns';
import { c } from 'ttag';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import emptyMailboxSvg from '@proton/styles/assets/img/placeholders/empty-mailbox.svg';
import {
    Button,
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    ReferralFeaturesList,
    useSettingsLink,
    useSubscription,
} from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';

const ReferralModal = () => {
    const appName = getAppName(APPS.PROTONMAIL);
    const planName = PLAN_NAMES[PLANS.PLUS];
    const [showModal, setShowModal] = useState(false);
    const [formattedEndDate, setFormattedEndDate] = useState('');
    const [subscription, loadingSubscription] = useSubscription();
    const settingsLink = useSettingsLink();

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

    const handlePlan = (plan: PLANS, target: 'compare' | 'checkout') => {
        const params = new URLSearchParams();
        params.set('plan', plan);
        params.set('type', 'referral');
        params.set('target', target);
        settingsLink(`/dashboard?${params.toString()}`);
    };

    return (
        <ModalTwo open={showModal}>
            <ModalTwoHeader
                title={
                    // translator: complete sentence would be : Your free trial ends soon, on 01/01/2022
                    c('Title').t`Your free trial ends soon, on ${formattedEndDate}`
                }
            />
            <ModalTwoContent>
                {loadingSubscription ? (
                    <Loader />
                ) : (
                    <>
                        <p>{
                            // translator: complete sentence would be "Upgrade today to avoid losing the following Mail Plus benefits"
                            c('Info').t`Upgrade today to avoid losing the following ${appName} ${planName} benefits.`
                        }</p>
                        <div className="flex flex-justify-center">
                            <img src={emptyMailboxSvg} alt="Mailbox image" />
                        </div>
                        <ReferralFeaturesList />
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                {/** TODO */}
                <Button
                    onClick={() => {
                        handlePlan(PLANS.PLUS, 'compare');
                    }}
                    shape="outline"
                >{c('Info').t`Other options`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        handlePlan(PLANS.PLUS, 'checkout');
                    }}
                >{c('Info').t`Continue with plus`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReferralModal;
