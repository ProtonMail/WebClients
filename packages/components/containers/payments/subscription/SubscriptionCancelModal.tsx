import React, { useState } from 'react';
import { c } from 'ttag';
import { BRAND_NAME, SUBSCRIPTION_CANCELLATION_REASONS } from 'proton-shared/lib/constants';
import { FormModal, SelectTwo, TextArea, Option, Scale, Button } from '../../../components';

export interface SubscriptionCancelModel {
    Reason?: string;
    Score?: number;
    Feedback?: string;
}

interface Props {
    onClose: () => void;
    onSkip: () => void;
    onSubmit: (model: SubscriptionCancelModel) => void;
}

const SubscriptionCancellationModal = ({ onSubmit, onClose, onSkip, ...rest }: Props) => {
    const [model, setModel] = useState<SubscriptionCancelModel>({
        Reason: '',
        Score: undefined,
        Feedback: '',
    });

    const handleChange = (field: string) => (e: any) => {
        setModel({
            ...model,
            [field]: e.target.value,
        });
    };

    const handleSubmit = () => {
        onSubmit(model);
        onClose();
    };

    const handleSkip = () => {
        onSkip();
        onClose();
    };

    const handleScoreChange = (Score: number) => {
        setModel({ ...model, Score });
    };

    return (
        <FormModal
            title={c('Title').t`Cancel subscription`}
            submit={c('Action').t`Submit`}
            close={<Button onClick={handleSkip}>{c('Action').t`Skip`}</Button>}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <div className="w75 on-mobile-w100">
                <div className="mb2">
                    <label className="mb1 block" htmlFor="reason">{c('Label')
                        .t`What is the main reason you are cancelling?`}</label>
                    <SelectTwo
                        id="reason"
                        autoFocus
                        value={model.Reason}
                        onChange={({ value }) => setModel({ ...model, Reason: value })}
                    >
                        <Option title={c('Option').t`Select a reason`} value="" />
                        <Option
                            title={c('Option').t`It’s temporary, I’ll be back`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.TEMPORARY}
                        />
                        <Option
                            title={c('Option').t`I didn’t understand what I was signing up for`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.SUBSCRIPTION_MISUNDERSTANDING}
                        />
                        <Option
                            title={c('Option').t`It’s too expensive`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.TOO_EXPENSIVE}
                        />
                        <Option
                            title={c('Option').t`I’m unhappy with customer service`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.UNHAPPY_WITH_CS}
                        />
                        <Option
                            title={c('Option').t`Using Proton is too complicated`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.TOO_COMPLICATED}
                        />
                        <Option
                            title={c('Option').t`I'm switching to a different service`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE}
                        />
                        <Option
                            title={c('Option').t`The quality didn't live up to my expectations`}
                            value={SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_BELOW_EXPECTATIONS}
                        />
                        <Option title={c('Option').t`Other`} value={SUBSCRIPTION_CANCELLATION_REASONS.OTHER} />
                    </SelectTwo>
                </div>

                <div className="mb2">
                    <label className="mb1 block" id="score-label">{c('Label')
                        .t`How likely are you to recommend ${BRAND_NAME} to others?`}</label>
                    <Scale
                        from={0}
                        to={10}
                        fromLabel={c('Label').t`0 - Not at all likely`}
                        toLabel={c('Label').t`10 - Extremely likely`}
                        value={model.Score}
                        InputButtonProps={{ 'aria-describedby': 'score-label' }}
                        onChange={handleScoreChange}
                    />
                </div>

                <div>
                    <label className="mb1 block" htmlFor="feedback">{c('Label')
                        .t`How do you think we could improve our products or service in the future?`}</label>
                    <TextArea
                        id="feedback"
                        value={model.Feedback}
                        placeholder={c('Placeholder').t`Feedback`}
                        onChange={handleChange('Feedback')}
                    />
                </div>
            </div>
        </FormModal>
    );
};

export default SubscriptionCancellationModal;
