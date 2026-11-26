import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import { PREVIOUS_PROVIDERS, type PreviousProvider } from '@proton/shared/lib/api/onboardingSurvey';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { PostSignupHeader } from '../components/PostSignupHeader';
import { PostSignupOption } from '../components/PostSignupOption';
import { PostSignupProgress } from '../components/PostSignupProgress';
import { getPreviousEmailChoices } from '../survey/choices';

interface Props {
    onBack: () => void;
    onSubmit: (providers: PreviousProvider[], providerDetail?: string) => void;
}

export const PreviousProviderStep = ({ onBack, onSubmit }: Props) => {
    const previousEmail = getPreviousEmailChoices();

    const [selected, setSelected] = useState<PreviousProvider[]>([]);
    const [detail, setDetail] = useState<string | undefined>(undefined);

    const handleSubmit = () => {
        if (selected.length === 0) {
            return;
        }

        // We send the details if at least one provider requires it
        const hasDetail = selected.some((provider) => previousEmail[provider].placeholder !== undefined);
        onSubmit(selected, hasDetail ? detail?.trim() || undefined : undefined);
    };

    const handleToggle = (provider: PreviousProvider, nextChecked: boolean) => {
        setSelected((current) => {
            if (!nextChecked) {
                return current.filter((p) => p !== provider);
            }

            // The API rejects "none" combined with other values
            return provider === 'none' ? ['none'] : [...current.filter((p) => p !== 'none'), provider];
        });
    };

    return (
        <div>
            <PostSignupProgress currentStep={2} steps={2} />
            <PostSignupHeader
                leadingText={c('Info').t`Almost done`}
                header={c('Header').t`Before ${MAIL_APP_NAME}, which email did you use most?`}
                subline={c('Info').t`Choose all that apply.`}
            />
            <div className="flex flex-column mb-4">
                {PREVIOUS_PROVIDERS.map((provider) => {
                    const checked = selected.includes(provider);

                    return (
                        <PostSignupOption
                            key={provider}
                            label={previousEmail[provider].title}
                            checked={checked}
                            detailPlaceholder={previousEmail[provider].placeholder}
                            detail={detail ?? ''}
                            onDetailChange={setDetail}
                            renderControl={(children) => (
                                <Checkbox
                                    checked={checked}
                                    name="email-providers"
                                    className="py-1.5"
                                    onChange={(e) => handleToggle(provider, e.target.checked)}
                                >
                                    {children}
                                </Checkbox>
                            )}
                        />
                    );
                })}
            </div>
            <p className="color-weak text-sm mt-0 mb-4">{c('Info')
                .t`Survey answers are not end-to-end encrypted, please do not share any sensitive information.`}</p>
            <div className="flex justify-space-between">
                <Button shape="ghost" onClick={onBack}>{c('Info').t`Back`}</Button>
                <Button color="norm" disabled={selected.length === 0} onClick={handleSubmit}>{c('Info')
                    .t`Start using ${MAIL_APP_NAME}`}</Button>
            </div>
        </div>
    );
};
