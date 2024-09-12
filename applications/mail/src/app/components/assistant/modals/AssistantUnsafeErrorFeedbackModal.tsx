import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalStateProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { useApi, useNotifications, useUserSettings } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useAssistant } from '@proton/llm/lib';
import type { AssistantFeedback } from '@proton/shared/lib/api/feedback';
import { sendAssistantFeedback } from '@proton/shared/lib/api/feedback';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props extends ModalStateProps {
    result?: string;
    prompt?: string;
}

const AssistantUnsafeErrorFeedbackModal = ({ result, prompt, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [{ AIAssistantFlags }] = useUserSettings();

    const { assistantConfig } = useAssistant();
    const [body, setBody] = useState<string | undefined>(undefined);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!body) {
            createNotification({
                text: c('Error').t`Please select a category and what went wrong with the generated text`,
                type: 'error',
            });
            return;
        }

        const isServer = AIAssistantFlags === AI_ASSISTANT_ACCESS.SERVER_ONLY;
        const requestBody: AssistantFeedback = {
            Category: 'false-positive-unsafe',
            Sentiment: 'Negative',
            Environment: isServer ? 'Remote' : 'Local',
            ModelID: isServer ? undefined : (assistantConfig?.model_list[0]?.model_id ?? ''),
            Body: body,
            Component: 'Mail',
            Prompt: prompt,
            ModelOutput: undefined,
        };

        await api(sendAssistantFeedback(requestBody));
        createNotification({ text: c('Error').t`Thanks for the feedback!` });

        rest.onClose();
    };

    return (
        <ModalTwo as="form" onSubmit={(e) => withLoading(handleSubmit(e))} {...rest}>
            <ModalTwoHeader title={c('Header').t`Report an issue`} />
            <ModalTwoContent>
                <TextArea
                    required
                    rows={3}
                    autoFocus
                    className="mb-2"
                    maxLength={1000}
                    onChange={({ target }) => setBody(target.value.trim())}
                    placeholder={c('Info').t`Please share what the issue is`}
                />
                <div className="flex color-hint flex-nowrap">
                    <Icon name="info-circle" className="mr-1 shrink-0" />
                    <span className="text-sm">{c('Assistant feedback')
                        .t`By submitting this feedback, the prompt and your comments will be visible to ${BRAND_NAME}'s moderation team.`}</span>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" className="mr-1" disabled={loading} onClick={() => rest.onClose()}>{c('Action')
                    .t`Cancel`}</Button>
                <Button type="submit" disabled={loading || !body} loading={loading} color="norm" className="mr-1">{c(
                    'Action'
                ).t`Submit`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AssistantUnsafeErrorFeedbackModal;
