import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Radio from '@proton/components/components/input/Radio';
import { JOIN_REASONS, type JoinReason } from '@proton/shared/lib/api/onboardingSurvey';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { PostSignupHeader } from './components/PostSignupHeader';
import { PostSignupOption } from './components/PostSignupOption';
import { PostSignupStep } from './components/PostSignupStep';

// Record<JoinReason, …> makes TypeScript fail when a reason is added without a label
const getLabels = (): Record<JoinReason, string> => ({
    no_ads: c('Info').t`No ads`,
    stop_reading_emails: c('Info').t`Stop companies reading my emails`,
    hacker_protection: c('Info').t`Protection from hackers and leaks`,
    leave_big_tech: c('Info').t`Leave Big Tech`,
    new_address: c('Info').t`A new or separate address`,
    recommended: c('Info').t`Someone recommended it`,
    other_proton_products: c('Info').t`I use other Proton products`,
    work_business: c('Info').t`Work or business`,
    specific_feature: c('Info').t`A specific feature (tell us)`,
    other: c('Info').t`Other (tell us)`,
});

// Reasons listed here also show a free text input
const getDetailPlaceholders = (): Partial<Record<JoinReason, string>> => ({
    specific_feature: c('Info').t`Which feature? (optional)`,
    other: c('Info').t`Tell us more (optional)`,
});

export interface PostSignupStep1Props {
    initialReason?: JoinReason;
    initialDetail?: string;
    onSubmit: (joinReason: JoinReason, joinReasonDetail?: string) => void;
    onDismiss: () => void;
}

export const PostSignupStep1 = ({ initialReason, initialDetail, onSubmit, onDismiss }: PostSignupStep1Props) => {
    const labels = getLabels();
    const placeholders = getDetailPlaceholders();

    const [selected, setSelected] = useState<JoinReason | undefined>(initialReason);
    const [detail, setDetail] = useState(initialDetail ?? '');

    const handleSubmit = () => {
        if (!selected) {
            return;
        }

        onSubmit(selected, placeholders[selected] !== undefined ? detail.trim() || undefined : undefined);
    };

    return (
        <div>
            <PostSignupStep currentStep={1} steps={2} />
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
                            label={labels[reason]}
                            checked={checked}
                            detailPlaceholder={placeholders[reason]}
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
