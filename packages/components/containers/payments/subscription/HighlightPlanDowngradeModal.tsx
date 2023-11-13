import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';

import {
    Alert,
    Form,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '../../../components';
import { ShortPlan } from '../features/interface';
import { getFreePlan } from '../features/plan';
import SubscriptionCancelPlan from './SubscriptionCancelPlan';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onConfirm: () => void;
    shortPlan: ShortPlan;
    periodEnd: number;
}

const HighlightPlanDowngradeModal = ({ onConfirm, onClose, shortPlan, periodEnd, ...rest }: Props) => {
    const downgradedShortPlan = getFreePlan();
    const downgradedPlanName = `${BRAND_NAME} ${downgradedShortPlan.title}`;
    const currentPlanName = shortPlan.title;

    const daysRemaining = getDifferenceInDays(new Date(), new Date(periodEnd * 1000));

    // translator: daysRemaining contains the number of days remaining for the current subscription eg 288 days remaining
    const planTimeRemainingString = c('new_plans: Plan time remaining').ngettext(
        msgid`You still have ${daysRemaining} day left on your ${currentPlanName} account.`,
        `You still have ${daysRemaining} days left on your ${currentPlanName} account.`,
        daysRemaining
    );

    // translator: will be something like "Downgrade to Proton Free" (where "Free" is the plan name)
    const downgradeButtonString = c('new_plans: Action').t`Downgrade to ${downgradedPlanName}`;

    // translator: will be something like "Keep my Proton Plus account"
    const keepButtonString = c('new_plans: Action').t`Keep my ${currentPlanName} account`;

    const shortPlanFeatures = shortPlan?.features?.filter((feature) => !feature.hideInDowngrade) || [];

    return (
        <Modal as={Form} onClose={onClose} size="large" {...rest}>
            <ModalHeader title={c('Title').t`Downgrade account`} />
            <ModalContent>
                {daysRemaining > 0 && (
                    <Alert className="mb-4" type="warning">
                        {planTimeRemainingString}
                        <br />
                        {c('Info')
                            .t`By downgrading you will lose the following benefits. Are you sure you want to proceed?`}
                    </Alert>
                )}
                <div className="flex flex-row flex-nowrap flex-column md:flex-row">
                    <SubscriptionCancelPlan
                        name={downgradedPlanName}
                        info={downgradedShortPlan?.description || ''}
                        features={shortPlanFeatures}
                        downgrade
                    />
                    <SubscriptionCancelPlan
                        name={currentPlanName}
                        info={shortPlan?.description || ''}
                        features={shortPlanFeatures}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button
                    className="w-full md:w-auto mb-4 md:mb-0"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    data-testid="downgrade-to-free"
                >
                    {downgradeButtonString}
                </Button>
                <Button className="w-full md:w-auto" color="norm" onClick={onClose}>
                    {keepButtonString}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default HighlightPlanDowngradeModal;
