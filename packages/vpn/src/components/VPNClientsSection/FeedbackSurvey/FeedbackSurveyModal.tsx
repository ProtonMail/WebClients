import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { type MaybeFreeSubscription, getPlan } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { telemetry } from '@proton/shared/lib/telemetry';

import { RadioElements } from './RadioElements';
import { getOptions } from './getOptions';
import { normalizeSupplementaryValue } from './normalizeSupplementaryValue';

type Props = Omit<ModalProps, 'onClose'> & {
    onClose: (discarted: boolean) => void;
    subscription: Subscription;
};

const getSubscriptionPlan = (subscription: MaybeFreeSubscription) => {
    const plan = getPlan(subscription);
    return `${plan?.Title.replace(' ', '_').toLowerCase()}_${plan?.Cycle}`;
};

const sendFeedback = (data: Record<string, unknown>) => telemetry.sendCustomEvent('feedbackPurchaseSurvey', data);

export const FeedbackSurveyModal = ({ subscription, ...props }: Props) => {
    const options = useMemo(getOptions, []);
    const [userChoice, setUserChoice] = useState<string | null>(null);
    const [supplementaryInputs, setSupplementaryInputs] = useState<Record<string, string>>({});
    const supplementaryValue = userChoice ? supplementaryInputs[userChoice]?.trim() : undefined;

    const isSubmitDisabled = () => {
        if (!userChoice) {
            return true;
        }

        if (userChoice === 'Other' && !supplementaryValue) {
            return true;
        }

        const selectedOption = options.find((option) => option.value === userChoice);
        if (selectedOption?.options && selectedOption.options.length > 0 && !supplementaryValue) {
            return true;
        }

        return false;
    };

    const submitFeedback = () => {
        if (!userChoice) {
            return;
        }

        const selectedOption = options.find((option) => option.value === userChoice);
        if (!selectedOption) {
            props.onClose(false);
            return;
        }

        const telemetryData: Record<string, unknown> = {
            channel_category: selectedOption.category,
            channel_source: userChoice === 'Other' ? supplementaryValue : selectedOption.value,
            subscription_plan: getSubscriptionPlan(subscription),
            platform: 'web',
        };

        if (supplementaryValue && userChoice !== 'Other') {
            const key = userChoice.toLowerCase() + '_value';
            telemetryData[key] = normalizeSupplementaryValue(supplementaryValue);
        }

        sendFeedback(telemetryData);
        props.onClose(false);
    };

    const handleCloseModalWithNoSubmit = () => {
        sendFeedback({
            channel_category: 'skipped',
            channel_source: '',
            subscription_plan: getSubscriptionPlan(subscription),
        });
        props.onClose(true);
    };

    return (
        <ModalTwo {...props} onClose={handleCloseModalWithNoSubmit} size="large">
            <ModalTwoHeader title={c('Title').t`How did you find out about us?`} />
            <ModalTwoContent>
                <div className="flex flex-column gap-3">
                    <RadioElements
                        onChangeRadio={setUserChoice}
                        radioValue={userChoice || ''}
                        onChangeSupplementary={(choice, value) =>
                            setSupplementaryInputs((prev) => ({ ...prev, [choice]: value }))
                        }
                        supplementaryInputs={supplementaryInputs}
                        options={options}
                        className="flex-nowrap"
                    />
                </div>
                {userChoice === 'Other' && (
                    <Input
                        className="mt-2"
                        placeholder={c('Info').t`Please specify...`}
                        onChange={(event) => setSupplementaryInputs((prev) => ({ ...prev, Other: event.target.value }))}
                        value={supplementaryInputs.Other || ''}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleCloseModalWithNoSubmit}>{c('Info').t`Cancel`}</Button>
                <Button disabled={isSubmitDisabled()} size="medium" color="norm" shape="solid" onClick={submitFeedback}>
                    {c('Info').t`Submit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
