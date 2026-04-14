import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { getPlan } from '@proton/payments/index';
import { telemetry } from '@proton/shared/lib/telemetry';

import { getFeedbackSurveyOptions } from './feedbackSurveyOptions';

type Props = Omit<ModalProps, 'onClose'> & {
    onClose: (discarted: boolean) => void;
};

const getSubscriptionPlan = (subscription: MaybeFreeSubscription) => {
    const plan = getPlan(subscription);
    return `${plan?.Title.replace(' ', '_').toLowerCase()}_${plan?.Cycle}`;
};

const sendFeedback = (data: Record<string, unknown>) => telemetry.sendCustomEvent('feedbackPurchaseSurvey', data);

export const FeedbackSurveyModal = (props: Props) => {
    const [userChoice, setUserChoice] = useState<string | null>(null);
    const [otherReason, setOtherReason] = useState<string | null>(null);
    const [subscription] = useSubscription();
    const options = useMemo(getFeedbackSurveyOptions, []);

    const isSubmitDisabled = () => {
        if (!userChoice) {
            return true;
        }
        if (userChoice === 'Other' && !otherReason) {
            return true;
        }

        return false;
    };

    const submitFeedback = () => {
        const channelCategory = options.find((option) => option.value === userChoice)?.category;
        if (!channelCategory) {
            props.onClose(false);
            return;
        }

        sendFeedback({
            channel_category: channelCategory,
            channel_source: userChoice === 'Other' ? otherReason : userChoice,
            subscription_plan: getSubscriptionPlan(subscription),
            platform: 'web',
        });
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
                <div className="flex flex-column gap-2 flex-nowrap">
                    <RadioGroup
                        onChange={setUserChoice}
                        value={userChoice || ''}
                        options={options.map((option) => {
                            return {
                                value: option.value,
                                label: option.content.hint ? (
                                    <span className="flex">
                                        <span>{option.content.label()}</span>
                                        &nbsp;
                                        <i className="color-hint">{option.content.hint()}</i>
                                    </span>
                                ) : (
                                    option.content.label()
                                ),
                            };
                        })}
                        name="feedback-suvey"
                        className="flex-nowrap"
                    />
                </div>
                {userChoice === 'Other' && (
                    <Input
                        className="mt-2"
                        placeholder={c('Info').t`Please specify...`}
                        onChange={(event) => setOtherReason(event.target.value)}
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
