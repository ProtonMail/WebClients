import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TextAreaTwo,
    useErrorHandler,
    useModalStateObject,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { APERTUS_15_MODEL } from '@proton/lumo-api-client/core/chat-completions';
import type { AssistantFeedback } from '@proton/shared/lib/api/feedback';
import { sendAssistantFeedback } from '@proton/shared/lib/api/feedback';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { stripAttachmentMarkdown } from '../../lib/imageAttachment';
import { useLumoSelector } from '../../redux/hooks';
import { selectMessageById, selectMessageHasGeneratedImages } from '../../redux/selectors';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import type { Message } from '../../types';
import {
    hasSeenNegativeFeedbackIntro,
    hasSeenPositiveFeedbackIntro,
    markNegativeFeedbackIntroSeen,
    markPositiveFeedbackIntroSeen,
} from '../../util/feedbackIntroStorage';
import { getFeedbackTools } from '../../util/feedbackTools';
import { getNativeAppInfo } from '../../util/userAgent';
import { LumoIcon } from '../LumoIcon/LumoIcon';

type FeedbackIntroType = 'positive' | 'negative';

interface Props {
    result?: string;
    message: Message;
    disabled: boolean;
    feedbackSubmitted: boolean;
    setFeedbackSubmitted: (value: boolean) => void;
}

const AssistantFeedbackModal = ({ disabled, message, feedbackSubmitted, setFeedbackSubmitted }: Props) => {
    const api = useApi();
    const { APP_VERSION } = useConfig();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const parentId = message?.parentId;
    const parentMessage = useLumoSelector((state) => (parentId ? selectMessageById(parentId)(state) : undefined));
    const hasGeneratedImages = useLumoSelector(selectMessageHasGeneratedImages(message.id));

    const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
    const [body, setBody] = useState<string | undefined>(undefined);
    const [introType, setIntroType] = useState<FeedbackIntroType | undefined>(undefined);

    // Apertus is only ever served when the user explicitly selects it (never via `auto`).
    const isApertusModel = message.requestedModel?.startsWith(APERTUS_15_MODEL) ?? false;

    const feedbackMetadata = useMemo((): Pick<
        AssistantFeedback,
        | 'ModelID'
        | 'RequestedModel'
        | 'HasGeneratedImages'
        | 'ToolsUsed'
        | 'Platform'
        | 'NativeAppVersion'
        | 'AppVersion'
        | 'PromptTokens'
        | 'CompletionTokens'
    > => {
        const nativeAppInfo = getNativeAppInfo();

        return {
            ModelID: message.modelID,
            RequestedModel: message.requestedModel,
            HasGeneratedImages: hasGeneratedImages,
            ToolsUsed: getFeedbackTools(message),
            Platform: nativeAppInfo?.platform ?? 'web',
            NativeAppVersion: nativeAppInfo?.version,
            AppVersion: APP_VERSION,
            PromptTokens: message.usage?.promptTokens,
            CompletionTokens: message.usage?.completionTokens,
        };
    }, [APP_VERSION, hasGeneratedImages, message]);

    const resetFeedbackForm = useCallback(() => {
        setSelectedOption(undefined);
        setBody(undefined);
    }, []);

    const feedbackModal = useModalStateObject({
        onClose: () => {
            setNativeComposerVisibility(true);
            resetFeedbackForm();
        },
    });

    const introModal = useModalStateObject({
        onClose: () => {
            setNativeComposerVisibility(true);
            setIntroType(undefined);
        },
    });

    const handlePositiveSubmit = useCallback(async () => {
        try {
            await api(
                sendAssistantFeedback({
                    Category: 'positive',
                    Sentiment: 'Positive',
                    Environment: 'Remote',
                    ...feedbackMetadata,
                    Body: '',
                    Component: 'Lumo',
                    ...(isApertusModel ? { ShareWithApertus: true } : {}),
                })
            );

            createNotification({ text: c('collider_2025: Success').t`Thanks for the feedback!` });
            setFeedbackSubmitted(true);
            setNativeComposerVisibility(true);
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Failure').t`There was an issue saving your feedback. Try again later.`,
            });
            setFeedbackSubmitted(false);
        }
    }, [
        api,
        createNotification,
        feedbackMetadata,
        isApertusModel,
        setFeedbackSubmitted,
    ]);

    const handleThumbUpClick = useCallback(() => {
        if (hasSeenPositiveFeedbackIntro()) {
            void withLoading(handlePositiveSubmit());
            return;
        }

        setIntroType('positive');
        introModal.openModal(true);
        setNativeComposerVisibility(false);
    }, [handlePositiveSubmit, introModal, withLoading]);

    const handleThumbDownClick = useCallback(() => {
        if (hasSeenNegativeFeedbackIntro()) {
            feedbackModal.openModal(true);
            setNativeComposerVisibility(false);
            return;
        }

        setIntroType('negative');
        introModal.openModal(true);
        setNativeComposerVisibility(false);
    }, [feedbackModal, introModal]);

    const handleIntroContinue = useCallback(() => {
        if (introType === 'positive') {
            markPositiveFeedbackIntroSeen();
            introModal.openModal(false);
            void withLoading(handlePositiveSubmit());
            return;
        }

        markNegativeFeedbackIntroSeen();
        introModal.openModal(false);
        feedbackModal.openModal(true);
    }, [feedbackModal, handlePositiveSubmit, introModal, introType, withLoading]);

    const submitFeedback = useCallback(
        async (requestBody: AssistantFeedback) => {
            try {
                await api(sendAssistantFeedback(requestBody));
                createNotification({ text: c('collider_2025: Success').t`Thanks for the feedback!` });
                setFeedbackSubmitted(true);
                resetFeedbackForm();
                feedbackModal.openModal(false);
                setNativeComposerVisibility(true);
            } catch (e) {
                createNotification({
                    type: 'error',
                    text: c('collider_2025: Failure').t`There was an issue saving your feedback. Try again later.`,
                });
                setFeedbackSubmitted(false);
                setNativeComposerVisibility(true);

                handleError(e);
            }
        },
        [api, createNotification, feedbackModal, handleError, resetFeedbackForm, setFeedbackSubmitted]
    );

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

        const requestBody: AssistantFeedback = {
            Category: selectedOption,
            Sentiment: 'Negative',
            Environment: 'Remote',
            ...feedbackMetadata,
            ...(isApertusModel ? { ShareWithApertus: true } : {}),
            Body: body || '',
            Component: 'Lumo',
            Prompt: stripAttachmentMarkdown(parentMessage?.content ?? ''),
            ModelOutput: stripAttachmentMarkdown(message.content ?? ''),
        };

        await submitFeedback(requestBody);
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
                    onClick={handleThumbUpClick}
                >
                    <LumoIcon
                        name="ThumbsUp"
                        size={16}
                        aria-label={c('collider_2025: Action').t`I like this response`}
                    />
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
                    onClick={handleThumbDownClick}
                >
                    <LumoIcon name="ThumbsDown" size={16} aria-label={c('collider_2025: Action').t`Report an issue`} />
                </Button>
            </Tooltip>
            <ModalTwo {...introModal.modalProps}>
                <ModalTwoHeader title={c('collider_2025: Header').t`Help us improve`} />
                <ModalTwoContent>
                    <p className="m-0 color-weak">
                        {introType === 'positive'
                            ? c('collider_2025: Info')
                                  .t`This shares your general sentiment and response metadata with ${BRAND_NAME}. Your prompt and the response are not included.`
                            : c('collider_2025: Info')
                                  .t`When you submit feedback, your prompt and this response are sent to ${BRAND_NAME} for analysis and improvement. Feedback about Apertus may also be shared with the Apertus team.`}
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter className="flex justify-end">
                    <Button type="button" color="norm" onClick={handleIntroContinue}>{c('collider_2025: Action')
                        .t`Continue`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
            <ModalTwo
                as="form"
                onSubmit={(e: FormEvent<HTMLFormElement>) => withLoading(handleSubmit(e))}
                {...feedbackModal.modalProps}
            >
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
                        value={body ?? ''}
                        onChange={({ target }) => setBody(target.value)}
                    />
                    <p className="m-0 text-sm color-weak">{c('collider_2025: Info')
                        .t`Your prompt and this response will be sent to ${BRAND_NAME} for analysis and improvement. Images and other attachments are not included.`}</p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        type="button"
                        className="mr-1"
                        disabled={loading}
                        onClick={() => {
                            feedbackModal.openModal(false);
                            setNativeComposerVisibility(true);
                        }}
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
