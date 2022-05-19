import { ChangeEvent, FormEvent, useState } from 'react';
import { c } from 'ttag';
import { sendFeedback } from '@proton/shared/lib/api/feedback';

import {
    Button,
    Scale,
    ScaleProps,
    TextArea,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalProps,
} from '../../components';
import { useApi, useLoading, useNotifications } from '../../hooks';

interface FeedbackModalModel {
    Score?: number;
    Feedback: string;
}

interface Props extends ModalProps {
    onClose?: () => void;
    feedbackType: string;
    description: string;
    scaleTitle: string;
    scaleProps: Omit<ScaleProps, 'value' | 'InputButtonProps' | 'onChange'>;
}

const FeedbackModal = ({ feedbackType, description, scaleTitle, scaleProps, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState<FeedbackModalModel>({
        Score: undefined,
        Feedback: '',
    });

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
            <ModalHeader title={c('Title').t`Give feedback`} />
            <ModalContent>
                <p className="mb2">{description}</p>
                <div className="mb2">
                    <label className="mb1 block" id="score-label">
                        {scaleTitle}
                    </label>
                    <div className="w75 on-mobile-w100">
                        <Scale
                            {...scaleProps}
                            value={model.Score}
                            InputButtonProps={{ 'aria-describedby': 'score-label' }}
                            onChange={handleScoreChange}
                        />
                    </div>
                </div>
                <div>
                    <label className="mb1 block" htmlFor="feedback-label">{c('Label')
                        .t`What is the primary reason for this rating?`}</label>
                    <TextArea
                        id="feedback-label"
                        value={model.Feedback}
                        placeholder={c('Placeholder').t`Feedback`}
                        onChange={handleChange('Feedback')}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={loading}>{c('Action').t`Submit`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default FeedbackModal;
