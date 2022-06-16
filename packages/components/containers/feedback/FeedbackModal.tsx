import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { c } from 'ttag';
import { sendFeedback } from '@proton/shared/lib/api/feedback';

import {
    Button,
    TextArea,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalProps,
    EmojiScale,
    EmojiScaleProps,
} from '../../components';
import { useApi, useLoading, useNotifications } from '../../hooks';

interface FeedbackModalModel {
    Score?: number;
    Feedback: string;
}

type FeedbackType = 'v4_migration' | 'calendar_launch' | 'web_clients_relaunch';

export interface FeedbackModalProps extends ModalProps {
    onClose?: () => void;
    onSuccess?: () => void;
    onMount?: () => void;
    feedbackType: FeedbackType;
    description?: string;
    scaleTitle: string;
    scaleProps: Omit<EmojiScaleProps, 'value' | 'InputButtonProps' | 'onChange'>;
}

const FeedbackModal = ({ feedbackType, description, scaleTitle, scaleProps, onMount, ...rest }: FeedbackModalProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState<FeedbackModalModel>({
        Score: undefined,
        Feedback: '',
    });

    useEffect(() => {
        onMount?.();
    }, []);

    const handleSubmit = async () => {
        if (model.Score === undefined) {
            createNotification({
                text: c('Error notification when score is missing in user feedback form modal').t`Score is required`,
                type: 'error',
            });
            return;
        }
        await api(
            sendFeedback({
                Score: model.Score,
                Feedback: model.Feedback,
                FeedbackType: feedbackType,
            })
        );
        createNotification({ text: c('Success notification when user send feedback').t`Feedback sent` });
        rest.onSuccess?.();
        rest.onClose?.();
    };

    const handleChange = (field: string) => (e: ChangeEvent<HTMLTextAreaElement>) => {
        setModel({
            ...model,
            [field]: e.target.value,
        });
    };

    const handleScoreChange = (Score: number) => {
        setModel({ ...model, Score });
    };

    return (
        <Modal
            as="form"
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                withLoading(handleSubmit());
            }}
            size="large"
            {...rest}
        >
            <ModalHeader title={c('Feedback Modal Title').t`Your feedback`} />
            <ModalContent>
                {description && <p className="mb2">{description}</p>}
                <div className="mb2">
                    <label className="mb1 block text-semibold" id="score-label">
                        {scaleTitle}
                    </label>
                    <div>
                        <EmojiScale
                            {...scaleProps}
                            value={model.Score}
                            InputButtonProps={{ 'aria-describedby': 'score-label' }}
                            onChange={handleScoreChange}
                        />
                    </div>
                </div>

                {model.Score !== undefined && (
                    <div>
                        <label className="mb1 block text-semibold" htmlFor="feedback-label">{c('new_plans: label')
                            .t`Tell us about your experience. (Optional)`}</label>
                        <TextArea
                            id="feedback-label"
                            value={model.Feedback}
                            placeholder={c('new_plans: placeholder').t`Feedback`}
                            onChange={handleChange('Feedback')}
                        />
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <Button disabled={loading} onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={loading}>{c('Action').t`Send feedback`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default FeedbackModal;
