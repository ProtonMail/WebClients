import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Checkbox,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tooltip,
    useModalStateObject,
} from '@proton/components';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { useApi, useNotifications, useUserSettings } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useAssistant } from '@proton/llm/lib';
import type { AssistantFeedback } from '@proton/shared/lib/api/feedback';
import { sendAssistantFeedback } from '@proton/shared/lib/api/feedback';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    result?: string;
    prompt?: string;
    disabled: boolean;
    feedbackSubmitted: boolean;
    setFeedbackSubmitted: (value: boolean) => void;
}

const AssistantFeedbackModal = ({ disabled, result, prompt, feedbackSubmitted, setFeedbackSubmitted }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [{ AIAssistantFlags }] = useUserSettings();

    const { assistantConfig } = useAssistant();
    const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
    const [body, setBody] = useState<string | undefined>(undefined);

    const isServerGeneration = AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY;

    const feedbackModal = useModalStateObject({
        onClose: () => {
            setSelectedOption(undefined);
        },
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedOption || !body) {
            createNotification({
                text: c('Error').t`Please select a category and what went wrong with the generated text`,
                type: 'error',
            });
            return;
        }

        const formData = new FormData(e.currentTarget);
        const modelContent = formData.get('model-content');

        const requestBody: AssistantFeedback = {
            Category: selectedOption,
            Sentiment: 'Negative',
            Environment: isServerGeneration ? 'Remote' : 'Local',
            ModelID: isServerGeneration ? undefined : (assistantConfig?.model_list[0]?.model_id ?? ''),
            Body: body,
            Component: 'Mail',
            Prompt: undefined,
            ModelOutput: undefined,
        };

        if (modelContent === 'on') {
            requestBody.Prompt = prompt;
            requestBody.ModelOutput = result;
        }

        await api(sendAssistantFeedback(requestBody));
        createNotification({ text: c('Success').t`Thanks for the feedback!` });

        setSelectedOption(undefined);
        feedbackModal.openModal(false);
        setFeedbackSubmitted(true);
    };

    const handlePositiveSubmit = async () => {
        await api(
            sendAssistantFeedback({
                Category: 'positive',
                Sentiment: 'Positive',
                Environment: isServerGeneration ? 'Remote' : 'Local',
                ModelID: isServerGeneration ? undefined : (assistantConfig?.model_list[0]?.model_id ?? ''),
                Body: '',
                Component: 'Mail',
            })
        );

        createNotification({ text: c('Success').t`Thanks for the feedback!` });
        setFeedbackSubmitted(true);
    };

    const feedbackOptions = [
        {
            label: c('Label').t`Don't like the style`,
            placeHolder: c('Placeholder').t`Please share what you expected`,
            value: 'style-issue',
        },
        {
            label: c('Label').t`Not factually correct`,
            placeHolder: c('Placeholder').t`Please share what you expected`,
            value: 'factually-incorrect',
        },
        {
            label: c('Label').t`Did not follow instructions`,
            placeHolder: c('Placeholder').t`Please share what you expected`,
            value: 'did-not-follow-instructions',
        },
        {
            label: c('Label').t`Unsafe or problematic`,
            placeHolder: c('Placeholder').t`Please share what you expected`,
            value: 'unsafe-or-problematic',
        },
    ];

    const textareaPlaceholder =
        feedbackOptions.find(({ value }) => value === selectedOption)?.placeHolder ??
        c('Info').t`Please share what you expected`;

    const disableButtons = feedbackSubmitted || loading || disabled;

    if (disabled) {
        return null;
    }

    return (
        <>
            <Tooltip title={c('Action').t`I like this response`}>
                <Button
                    icon
                    shape="ghost"
                    style={{ '--padding-block': '0.3125rem', '--padding-inline': '0.3125rem' }}
                    disabled={disableButtons}
                    loading={loading}
                    onClick={() => withLoading(handlePositiveSubmit())}
                >
                    <Icon name="thumb-up" size={6} alt={c('Action').t`I like this response`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Report an issue`}>
                <Button
                    icon
                    shape="ghost"
                    style={{ '--padding-block': '0.3125rem', '--padding-inline': '0.3125rem' }}
                    disabled={disableButtons}
                    onClick={() => feedbackModal.openModal(true)}
                >
                    <Icon name="thumb-down" size={6} alt={c('Action').t`Report an issue`} />
                </Button>
            </Tooltip>
            <ModalTwo as="form" onSubmit={(e) => withLoading(handleSubmit(e))} {...feedbackModal.modalProps}>
                <ModalTwoHeader title={c('Header').t`Tell us more`} />
                <ModalTwoContent>
                    <ul className="unstyled m-0 mb-1">
                        {feedbackOptions.map(({ label, value }) => {
                            const isSelected = selectedOption === value;

                            return (
                                <li className="inline-flex" key={value}>
                                    <Button
                                        size="small"
                                        shape={isSelected ? 'solid' : 'outline'}
                                        color={isSelected ? 'norm' : undefined}
                                        className="mr-2 mb-2"
                                        aria-pressed={isSelected}
                                        onClick={() => setSelectedOption(value)}
                                    >
                                        {label}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                    <TextArea
                        required
                        rows={3}
                        className="mb-2"
                        maxLength={1000}
                        onChange={({ target }) => setBody(target.value.trim())}
                        placeholder={textareaPlaceholder}
                    />
                    <div className="flex flex-nowrap items-start">
                        <Checkbox id="model-content" name="model-content" defaultChecked className="mr-2 mt-0.5" />
                        <label htmlFor="model-content" className="flex-1">
                            <span>{c('Info')
                                .t`Include your prompt and the response to help us improve accuracy.`}</span>
                        </label>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        type="button"
                        className="mr-1"
                        disabled={loading}
                        onClick={() => feedbackModal.openModal(false)}
                    >{c('Action').t`Cancel`}</Button>
                    <Button
                        type="submit"
                        disabled={loading || !selectedOption || !body}
                        loading={loading}
                        color="norm"
                        className="mr-1"
                    >{c('Action').t`Submit`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default AssistantFeedbackModal;
