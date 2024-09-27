import { useEffect } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { ReferralFeaturesList } from '@proton/components/containers/referral/ReferralFeaturesList';
import { FeatureCode, useFeature } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import emptyMailboxSvg from '@proton/styles/assets/img/illustrations/empty-mailbox.svg';

interface Props extends ModalProps<'div'> {
    endDate: Date;
}

export const ReferralModal = ({ endDate, ...rest }: Props) => {
    const planName = PLAN_NAMES[PLANS.MAIL];
    const settingsLink = useSettingsLink();
    const { feature, update } = useFeature(FeatureCode.SeenReferralModal);

    useEffect(() => {
        if (!open) {
            return;
        }
        if (feature?.Value === false) {
            void update(true);
        }
    }, [open]);

    const handlePlan = (plan: PLANS, target: 'compare' | 'checkout') => {
        const params = new URLSearchParams();
        params.set('plan', plan);
        params.set('type', 'referral');
        params.set('target', target);
        settingsLink(`/dashboard?${params.toString()}`);
    };

    const formattedEndDate = format(endDate, 'P', { locale: dateLocale });

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader
                title={
                    // translator: complete sentence would be : Your free trial ends soon, on 01/01/2022
                    c('Title').t`Your free trial ends soon, on ${formattedEndDate}`
                }
            />
            <ModalTwoContent>
                <p>{
                    // translator: complete sentence would be "Upgrade today to avoid losing the following Mail Plus benefits"
                    c('Info').t`Upgrade today to avoid losing the following ${planName} benefits.`
                }</p>
                <div className="flex justify-center">
                    <img src={emptyMailboxSvg} alt="Mailbox image" />
                </div>
                <ReferralFeaturesList />
            </ModalTwoContent>
            <ModalTwoFooter>
                {/** TODO */}
                <Button
                    onClick={() => {
                        rest.onClose?.();
                        handlePlan(PLANS.MAIL, 'compare');
                    }}
                    shape="outline"
                >{c('Info').t`Other options`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        rest.onClose?.();
                        handlePlan(PLANS.MAIL, 'checkout');
                    }}
                >{
                    // translator: full sentence could be "Continue with Plus"
                    c('Info').t`Continue with ${planName}`
                }</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
