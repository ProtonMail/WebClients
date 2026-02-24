import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    Checkbox,
    Icon,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TextAreaTwo,
    useApi,
    useErrorHandler,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { AssistantFeedback } from '@proton/shared/lib/api/feedback';
import { sendAssistantFeedback } from '@proton/shared/lib/api/feedback';

import { useLumoSelector } from '../../redux/hooks';
import { selectMessageById } from '../../redux/selectors';
import type { Message } from '../../types';

interface Props {
    result?: string;
    message: Message;
    disabled: boolean;
    feedbackSubmitted: boolean;
    setFeedbackSubmitted: (value: boolean) => void;
}

const AssistantFeedbackModal = ({ disabled, message, feedbackSubmitted, setFeedbackSubmitted }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const parentId = message?.parentId;
    const parentMessage = useLumoSelector((state) => (parentId ? selectMessageById(parentId)(state) : undefined));

    const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
    const [body, setBody] = useState<string | undefined>(undefined);

    const feedbackModal = useModalStateObject({
        onClose: () => {
            setSelectedOption(undefined);
        },
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedOption) {
            createNotification({
                text: c('collider_2025: Error')
                    .t`Please select a category to describe what went wrong with the generated text`,
                type: 'error',
            });
            return;
        }

        const formData = new FormData(e.currentTarget);
        const modelContent = formData.get('model-content');

        const requestBody: AssistantFeedback = {
            Category: selectedOption,
            Sentiment: 'Negative',
            Environment: 'Remote',
            ModelID: undefined,
            Body: body || '',
            Component: 'Lumo',
            Prompt: undefined,
            ModelOutput: undefined,
        };

        if (modelContent === 'on') {
            requestBody.Prompt = parentMessage?.content;
            requestBody.ModelOutput = message?.content;
        }

        try {
            await api(sendAssistantFeedback(requestBody));
            createNotification({ text: c('collider_2025: Success').t`Thanks for the feedback!` });
            setFeedbackSubmitted(true);
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('collider_2025: Failure').t`There was an issue saving your feedback. Try again later.`,
            });
            setFeedbackSubmitted(false);

            handleError(e);
        }

        setSelectedOption(undefined);
        feedbackModal.openModal(false);
    };

    const handlePositiveSubmit = async () => {
        try {
            await api(
                sendAssistantFeedback({
                    Category: 'positive',
                    Sentiment: 'Positive',
                    Environment: 'Remote',
                    ModelID: undefined,
                    Body: '',
                    Component: 'Lumo',
                })
            );

            createNotification({ text: c('collider_2025: Success').t`Thanks for the feedback!` });
            setFeedbackSubmitted(true);
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('collider_2025: Failure').t`There was an issue saving your feedback. Try again later.`,
            });
            setFeedbackSubmitted(false);
        }
    };

    const feedbackOptions = [
        {
            label: c('collider_2025: Label').t`Don't like the style`,
            placeHolder: c('collider_2025: Placeholder').t`Please share what you expected`,
            value: 'style-issue',
        },
        {
            label: c('collider_2025: Label').t`Not factually correct`,
            placeHolder: c('collider_2025: Placeholder').t`Please share what you expected`,
            value: 'factually-incorrect',
        },
        {
            label: c('collider_2025: Label').t`Did not follow instructions`,
            placeHolder: c('collider_2025: Placeholder').t`Please share what you expected`,
            value: 'did-not-follow-instructions',
        },
        {
            label: c('collider_2025: Label').t`Unsafe or problematic`,
            placeHolder: c('collider_2025: Placeholder').t`Please share what you expected`,
            value: 'unsafe-or-problematic',
        },
    ];

    const textareaPlaceholder =
        feedbackOptions.find(({ value }) => value === selectedOption)?.placeHolder ??
        c('collider_2025: Info').t`Please share what you expected`;

    const disableButtons = feedbackSubmitted || loading || disabled;

    if (disabled) {
        return null;
    }

    return (
        <>
            <Tooltip title={c('collider_2025: Action').t`I like this response`}>
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    className="lumo-no-copy"
                    // style={{ '--padding-block': '0.3125rem', '--padding-inline': '0.3125rem' }}
                    disabled={disableButtons}
                    loading={loading}
                    onClick={() => withLoading(handlePositiveSubmit())}
                >
                    <Icon name="thumb-up" size={4} alt={c('collider_2025: Action').t`I like this response`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('collider_2025: Action').t`Report an issue`}>
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    className="lumo-no-copy"
                    // style={{ '--padding-block': '0.3125rem', '--padding-inline': '0.3125rem' }}
                    disabled={disableButtons}
                    onClick={() => feedbackModal.openModal(true)}
                >
                    <Icon name="thumb-down" size={4} alt={c('collider_2025: Action').t`Report an issue`} />
                </Button>
            </Tooltip>
            <ModalTwo as="form" onSubmit={(e) => withLoading(handleSubmit(e))} {...feedbackModal.modalProps}>
                <ModalTwoHeader title={c('collider_2025: Header').t`Tell us more`} />
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
                    <InputFieldTwo
                        as={TextAreaTwo}
                        rows={3}
                        label={textareaPlaceholder}
                        maxLength={1000}
                        onChange={({ target }) => setBody(target.value.trim())}
                    />
                    <div className="flex flex-nowrap items-start">
                        <Checkbox id="model-content" name="model-content" defaultChecked className="mr-2" />
                        <label htmlFor="model-content" className="flex-1 mt-0">
                            <span>{c('collider_2025: Info')
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
                    >{c('collider_2025: Action').t`Cancel`}</Button>
                    <Button
                        type="submit"
                        disabled={loading || !selectedOption}
                        loading={loading}
                        color="norm"
                        className="mr-1"
                    >{c('collider_2025: Action').t`Submit`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default AssistantFeedbackModal;
