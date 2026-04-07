import { useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Label, TextAreaTwo } from '@proton/components/index';
import { type Either, left } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';

const useCreateNotifications = () => {
    const { createNotification } = useNotifications();

    const success = () =>
        createNotification({
            key: 'sidebar-feedback-sent',
            text: c('Info').t`Thanks - your feedback was sent.`,
            type: 'info',
        });

    const failure = () =>
        createNotification({
            key: 'sidebar-feedback-send-failure',
            text: c('Info').t`Couldn´t send feedback`,
            type: 'error',
        });

    return { success, failure };
};

interface Props extends ModalStateProps {
    onAction: () => void;
}
const onSubmit: () => Promise<Either<'ok', 'error'>> = async () => {
    return left('ok');
};

export const FeedbackModal = (props: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const notifications = useCreateNotifications();

    const feedbackElement = useRef<HTMLTextAreaElement>(null);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const status = await onSubmit();
        telemetry.sendCustomEvent('b2bAdminSidebarFeedback', {
            feedback,
            platform: 'web',
        });
        setIsSubmitting(false);

        status.match({
            left: () => {
                props.onAction?.();
                notifications.success();
                props.onClose?.();
            },
            right: () => {
                props.onAction?.();
                notifications.failure();
            },
        });
    };

    useLayoutEffect(() => {
        feedbackElement.current?.focus();
    }, []);

    return (
        <ModalTwo as={Form} size="small" onSubmit={handleSubmit} {...props}>
            <ModalTwoHeader title={c('Title').t`Help us improve`} />
            <ModalTwoContent className="flex flex-column gap-1">
                <Label htmlFor="b2b-admin-feedback-content" className="text-semibold">{c('Info')
                    .t`Your feedback`}</Label>
                <TextAreaTwo
                    name="b2b-admin-feedback-content"
                    ref={feedbackElement}
                    value={feedback}
                    onValue={setFeedback}
                    placeholder={c('Info').t`Share your thoughts...`}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={props.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button disabled={!feedback.trim().length} type="submit" loading={isSubmitting}>
                    {c('Action').t`Send feedback`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
