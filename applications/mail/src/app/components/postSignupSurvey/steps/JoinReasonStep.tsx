import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Radio from '@proton/components/components/input/Radio';
import { JOIN_REASONS, type JoinReason } from '@proton/shared/lib/api/onboardingSurvey';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { PostSignupHeader } from '../components/PostSignupHeader';
import { PostSignupOption } from '../components/PostSignupOption';
import { PostSignupProgress } from '../components/PostSignupProgress';
import { getJoinReasonChoices } from '../survey/choices';

export interface JoinReasonStepProps {
    initialReason?: JoinReason;
    initialDetail?: string;
    onSubmit: (joinReason: JoinReason, joinReasonDetail?: string) => void;
    onDismiss: () => void;
}

export const JoinReasonStep = ({ initialReason, initialDetail, onSubmit, onDismiss }: JoinReasonStepProps) => {
    const joinReasonChoices = getJoinReasonChoices();

    const [selected, setSelected] = useState<JoinReason | undefined>(initialReason);
    const [detail, setDetail] = useState(initialDetail ?? '');

    const handleSubmit = () => {
        if (!selected) {
            return;
        }

        const details = detail.trim() || undefined;
        onSubmit(selected, joinReasonChoices[selected].placeholder !== undefined ? details : undefined);
    };

    return (
        <div>
            <PostSignupProgress currentStep={1} steps={2} />
            <PostSignupHeader
                leadingText={c('Info').t`One last step`}
                header={c('Header').t`What's the main reason you joined ${MAIL_APP_NAME}?`}
                subline={c('Info').t`Choose one. It helps us improve ${MAIL_APP_NAME}.`}
            />
            <div className="flex flex-column mb-4">
                {JOIN_REASONS.map((reason) => {
                    const checked = selected === reason;

                    return (
                        <PostSignupOption
                            key={reason}
                            label={joinReasonChoices[reason].title}
                            checked={checked}
                            detailPlaceholder={joinReasonChoices[reason].placeholder}
                            detail={detail}
                            onDetailChange={setDetail}
                            renderControl={(children) => (
                                <Radio
                                    id={`selected-reason-radio_${reason}`}
                                    name="selected-reason"
                                    className="py-2"
                                    checked={checked}
                                    onChange={() => {
                                        setSelected(reason);
                                        setDetail('');
                                    }}
                                >
                                    {children}
                                </Radio>
                            )}
                        />
                    );
                })}
            </div>
            <p className="color-weak text-sm mt-0 mb-4">{c('Info')
                .t`Survey answers are not end-to-end encrypted, please do not share any sensitive information.`}</p>
            <div className="flex justify-space-between">
                <Button shape="ghost" onClick={onDismiss}>{c('Info').t`Dismiss`}</Button>
                <Button color="norm" onClick={handleSubmit} disabled={!selected}>{c('Info').t`Next`}</Button>
            </div>
        </div>
    );
};
