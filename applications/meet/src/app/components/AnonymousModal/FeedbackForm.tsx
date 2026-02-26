import { type Dispatch, type SetStateAction, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useNotifications from '@proton/components/hooks/useNotifications';
import { InputFieldTwo, TextAreaTwo } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingLink } from '@proton/meet/store/slices';
import { isValidMeetingLink, parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import useFlag from '@proton/unleash/useFlag';

import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackOptionColumn } from '../FeedbackOptionColumn/FeedbackOptionColumn';
import { StarRating } from '../StarRating/StarRating';

import './FeedbackForm.scss';

type Props = {
    onClose: () => void;
    setIsFinished: Dispatch<SetStateAction<boolean>>;
};

// Used to determine if the rating is high or low and display the feedback form accordingly.
const RATING_THRESHOLD = 4;

export const FeedbackForm = ({ onClose, setIsFinished: setIsFinished }: Props) => {
    const meetFeedbackOnSkipEnabled = useFlag('MeetFeedbackOnSkip');

    const [rating, SetRating] = useState<number | undefined>(undefined);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [optionalDetails, setOptionalDetails] = useState(false);

    const [isLoading, withLoading] = useLoading();
    const submitFeedback = useFeedback();
    const notifications = useNotifications();
    const previousMeetingLink = useMeetSelector(selectPreviousMeetingLink);

    const handleOptionSelect = (option: string) => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(selectedOptions.filter((o) => o !== option));
        } else {
            setSelectedOptions([...selectedOptions, option]);
        }
    };

    const handleSubmit = async ({
        score,
        feedbackOptions,
        comment,
        closeAfterSubmit = false,
    }: {
        score: number;
        feedbackOptions?: string[];
        comment?: string;
        closeAfterSubmit?: boolean;
    }) => {
        const allFeedback: string[] = [];

        if (feedbackOptions && feedbackOptions.length > 0) {
            allFeedback.push(...feedbackOptions);
        }

        if (comment) {
            allFeedback.push(comment);
        }

        if (previousMeetingLink === null) {
            notifications.createNotification({
                type: 'error',
                text: c('Notification').t`You can't send a feedback for a meeting you haven't been to`,
            });
            return;
        }

        if (!isValidMeetingLink(previousMeetingLink)) {
            onClose();
            notifications.createNotification({
                type: 'error',
                text: c('Notification').t`Could not send feedback`,
            });
            return;
        }

        const { meetingId } = parseMeetingLink(previousMeetingLink);

        await submitFeedback({
            meetingId,
            score,
            feedbackOptions: allFeedback,
        })
            .then(() => {
                if (closeAfterSubmit) {
                    onClose();
                } else {
                    setIsFinished(true);
                }
            })
            .catch(() => {
                onClose();
                notifications.createNotification({
                    type: 'error',
                    text: c('Notification').t`Could not send feedback`,
                });
            });
    };

    const audioOptions = [
        c('Option').t`Audio was breaking up`,
        c('Option').t`I couldn't hear others`,
        c('Option').t`Others couldn't hear me`,
    ];
    const videoOptions = [
        c('Option').t`Video was breaking up`,
        c('Option').t`Video was blurry`,
        c('Option').t`I couldn't see others' video`,
    ];
    const screenShareOptions = [
        c('Option').t`The presentation was blurry`,
        c('Option').t`I couldn't see the presentation`,
        c('Option').t`I couldn't present `,
    ];

    const isHighRating = rating && rating >= RATING_THRESHOLD;
    const isLowRating = rating && rating < RATING_THRESHOLD;

    return (
        <>
            <div
                className="flex flex-column md:flex-row items-center gap-2 mt-20 mb-5 w-full max-w-custom"
                style={{ '--max-w-custom': '37rem' }}
            >
                <span className="text-semibold text-left feedback-form-rating-label">{c('Label')
                    .t`How was the call quality?`}</span>
                <StarRating value={rating} onChange={SetRating} className="md:flex-1 flex-nowrap"></StarRating>
                {isHighRating && (
                    <Button
                        className="secondary rounded-full py-3 px-10 text-semibold w-full md:w-auto"
                        loading={isLoading}
                        disabled={isLoading}
                        onClick={async () => {
                            await withLoading(handleSubmit({ score: rating }));
                        }}
                        size="medium"
                    >
                        {c('Action').t`Submit`}
                    </Button>
                )}
            </div>
            {isLowRating && (
                <>
                    <div className="cta-modal-title text-semibold color-norm pt-10 pb-10">{c('Title')
                        .t`What went wrong?`}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 w-full md:w-auto">
                        <FeedbackOptionColumn
                            options={audioOptions}
                            selectedOptions={selectedOptions}
                            onOptionSelect={handleOptionSelect}
                        />
                        <FeedbackOptionColumn
                            options={videoOptions}
                            selectedOptions={selectedOptions}
                            onOptionSelect={handleOptionSelect}
                        />
                        <FeedbackOptionColumn
                            options={screenShareOptions}
                            selectedOptions={selectedOptions}
                            onOptionSelect={handleOptionSelect}
                        />
                        <div className="w-full flex flex-nowrap items-center justify-start gap-2 text-semibold mt-4 grid-row-full-width">
                            <InlineLinkButton
                                className="flex add-details-button items-center gap-2"
                                onClick={() => setOptionalDetails(!optionalDetails)}
                            >
                                {optionalDetails ? <IcMinus /> : <IcPlus />}
                                {c('Label').t`Add optional details`}
                            </InlineLinkButton>
                        </div>
                        {optionalDetails && (
                            <div className="mt-4 grid-row-full-width">
                                <InputFieldTwo
                                    className="feedback-comment w-full p-6"
                                    as={TextAreaTwo}
                                    rows={3}
                                    value={comment}
                                    onValue={setComment}
                                    placeholder={c('Placeholder').t`Share more details`}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-column md:flex-row gap-2 items-center mt-4 w-full max-w-custom">
                        <Button
                            className="secondary rounded-full py-3 px-10 text-semibold w-full md:w-auto flex-auto"
                            onClick={async () => {
                                if (meetFeedbackOnSkipEnabled) {
                                    await handleSubmit({
                                        score: rating,
                                        feedbackOptions: selectedOptions,
                                        closeAfterSubmit: true,
                                    });
                                }
                            }}
                            size="large"
                        >
                            {c('Action').t`Skip`}
                        </Button>
                        <Button
                            className="primary rounded-full py-3 px-10 text-semibold w-full md:w-auto flex-auto"
                            onClick={async () => {
                                await withLoading(
                                    handleSubmit({
                                        score: rating,
                                        feedbackOptions: selectedOptions,
                                        comment: optionalDetails ? comment : undefined,
                                    })
                                );
                            }}
                            size="large"
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {c('Action').t`Submit`}
                        </Button>
                    </div>
                </>
            )}
        </>
    );
};
