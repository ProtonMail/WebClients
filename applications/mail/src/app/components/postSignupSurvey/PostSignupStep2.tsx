import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { PostSignupHeader } from './components/PostSignupHeader';
import { PostSignupOption } from './components/PostSignupOption';
import { PostSignupStep } from './components/PostSignupStep';
import { PREVIOUS_PROVIDERS, type PreviousProvider } from './interface';

interface Props {
    onBack: () => void;
    onSubmit: (providers: PreviousProvider[], providerDetail: string) => void;
}

const getLabels = (): Record<PreviousProvider, string> => ({
    // Brand names, not translated
    gmail: 'Gmail',
    outlook: 'Outlook / Hotmail',
    yahoo: 'Yahoo',
    icloud: 'iCloud',
    none: c('Info').t`I didn't have one`,
    other: c('Info').t`Other (tell us)`,
});

const getDetailPlaceholders = (): Partial<Record<PreviousProvider, string>> => ({
    other: c('Info').t`Which provider?`,
});

export const PostSignupStep2 = ({ onBack, onSubmit }: Props) => {
    const labels = getLabels();
    const placeholders = getDetailPlaceholders();

    const [selected, setSelected] = useState<PreviousProvider[]>([]);
    const [detail, setDetail] = useState('');

    const handleSubmit = () => {
        if (selected.length === 0) {
            return;
        }

        // We send the details if at least one provider requires it
        const hasDetail = selected.some((provider) => placeholders[provider] !== undefined);
        onSubmit(selected, hasDetail ? detail.trim() : '');
    };

    const handleToggle = (provider: PreviousProvider, nextChecked: boolean) => {
        if (nextChecked) {
            setSelected((current) => [...current, provider]);
        } else {
            setSelected((current) => current.filter((p) => p !== provider));
        }
    };

    return (
        <div>
            <PostSignupStep currentStep={2} steps={2} />
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
                            label={labels[provider]}
                            checked={checked}
                            detailPlaceholder={placeholders[provider]}
                            detail={detail}
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
            <div className="flex justify-space-between">
                <Button shape="ghost" onClick={onBack}>{c('Info').t`Back`}</Button>
                <Button color="norm" disabled={selected.length === 0} onClick={handleSubmit}>{c('Info')
                    .t`Start using ${MAIL_APP_NAME}`}</Button>
            </div>
        </div>
    );
};
