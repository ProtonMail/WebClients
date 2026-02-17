import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { BRAND_NAME, MEET_APP_NAME } from '@proton/shared/lib/constants';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';
import upsellModalIcon from '@proton/styles/assets/img/meet/upsell-modal-icon.png';
import upsellRoomIcon from '@proton/styles/assets/img/meet/upsell-room-icon.svg';
import upsellScheduleIcon from '@proton/styles/assets/img/meet/upsell-schedule-icon.svg';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackOptionColumn } from '../FeedbackOptionColumn/FeedbackOptionColumn';
import { MeetSignIn } from '../SignIn/SignIn';
import { StarRating } from '../StarRating/StarRating';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

import './CTAModal.scss';

interface CTAModalProps {
    open: boolean;
    onClose: () => void;
    ctaModalType: UpsellModalTypes;
    rejoin?: () => void;
    action: () => void;
}

const formatUpsellMessage = (message: string) => {
    return getBoldFormattedText(message, 'color-white');
};

export const CTAModal = ({ open, onClose, ctaModalType, rejoin, action }: CTAModalProps) => {
    const meetFeedbackEnabled = useFlag('MeetFeedback');
    const submitFeedback = useFeedback();
    const notifications = useNotifications();
    const [isLoading, withLoading] = useLoading();
    const [isLoadingSkip, withLoadingSkip] = useLoading();

    const [rating, SetRating] = useState<number | undefined>(undefined);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [optionalDetails, setOptionalDetails] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const signIn = (
        <MeetSignIn key="signin" className="sign-in-button p-0 ml-1">
            {c('Link').t`Sign in`}
        </MeetSignIn>
    );

    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');
    const titles = {
        [UpsellModalTypes.Schedule]: c('Info').t`You are almost there`,
        [UpsellModalTypes.Room]: c('Info').t`You are almost there`,
        [UpsellModalTypes.PersonalMeeting]: c('Info').t`You are almost there`,
        [UpsellModalTypes.StartMeeting]: c('Info').t`Host your own secure meeting`,
        [UpsellModalTypes.HostFreeAccount]: c('Info').t`You left your meeting`,
        [UpsellModalTypes.HostPaidAccount]: c('Info').t`You left your meeting`,
        [UpsellModalTypes.GuestAccount]: c('Info').t`You left your meeting`,
        [UpsellModalTypes.FreeAccount]: c('Info').t`You left your meeting`,
        [UpsellModalTypes.PaidAccount]: c('Info').t`You left your meeting`,
    };

    // To keep reusing the same subtitle on all subsequent re-renders
    const guestAccountSubtitle = useMemo(() => {
        const options = [
            c('Info').t`Create an account to host meetings with up to 50 participants.`,
            c('Info')
                .t`Get a personal meeting room. Create an account to have a personal meeting link that you can use at any time.`,
            c('Info').t`Schedule your next meeting. Create an account to schedule meetings with your calendar.`,
        ];
        return options[Math.floor(Math.random() * options.length)];
    }, []);

    const subtitles = {
        [UpsellModalTypes.Schedule]: formatUpsellMessage(
            c('Info')
                .t`To schedule a meeting, **create a free ${BRAND_NAME} account**. You will return to ${MEET_APP_NAME} automatically.`
        ),
        [UpsellModalTypes.Room]: formatUpsellMessage(
            c('Info')
                .t`To create a room, **create a free ${BRAND_NAME} account**. You will return to ${MEET_APP_NAME} automatically.`
        ),
        [UpsellModalTypes.PersonalMeeting]: formatUpsellMessage(
            c('Info')
                .t`To use your personal meeting room, **create a free ${BRAND_NAME} account**. You will return to ${MEET_APP_NAME} automatically.`
        ),
        [UpsellModalTypes.HostFreeAccount]: c('Info')
            .t`Meet without restrictions. Upgrade to remove the 1-hour limit and host up to 100 participants.`,
        [UpsellModalTypes.HostPaidAccount]: c('Info').t`Thank you for hosting a premium meeting.`,
        [UpsellModalTypes.StartMeeting]: c('Info')
            .t`Start a call in ${MEET_APP_NAME} and share the link to invite anyone to join. Simple, secure, and free.`,
        [UpsellModalTypes.GuestAccount]: guestAccountSubtitle,
        [UpsellModalTypes.FreeAccount]: c('Info')
            .t`Host your own secure meeting. Start a call in ${MEET_APP_NAME} and share the link to invite anyone to join. Simple, secure, and free.`,
        [UpsellModalTypes.PaidAccount]: c('Info').t`Thank you for joining.`,
    };

    const actionText = {
        [UpsellModalTypes.Schedule]: c('Action').t`Continue`,
        [UpsellModalTypes.Room]: c('Action').t`Continue`,
        [UpsellModalTypes.PersonalMeeting]: c('Action').t`Continue`,
        [UpsellModalTypes.StartMeeting]: c('Action').t`Start a meeting`,
        [UpsellModalTypes.HostFreeAccount]: c('Action').t`Get Meet Professional`,
        [UpsellModalTypes.HostPaidAccount]: undefined,
        [UpsellModalTypes.GuestAccount]: c('Action').t`Create a free account`,
        [UpsellModalTypes.FreeAccount]: c('Action').t`Start your own meeting`,
        [UpsellModalTypes.PaidAccount]: undefined,
    };

    const secondaryActionText = {
        [UpsellModalTypes.Schedule]: undefined,
        [UpsellModalTypes.Room]: undefined,
        [UpsellModalTypes.PersonalMeeting]: undefined,
        [UpsellModalTypes.StartMeeting]: undefined,
        [UpsellModalTypes.HostFreeAccount]: undefined,
        [UpsellModalTypes.HostPaidAccount]: undefined,
        [UpsellModalTypes.GuestAccount]: c('Action').t`Get Meet Professional`,
        [UpsellModalTypes.FreeAccount]: undefined,
        [UpsellModalTypes.PaidAccount]: undefined,
    };

    const isUpsellModal = () => {
        return (
            ctaModalType === UpsellModalTypes.Schedule ||
            ctaModalType === UpsellModalTypes.Room ||
            ctaModalType === UpsellModalTypes.PersonalMeeting
        );
    };

    const actionButton = (
        <Button
            className={clsx(
                'rounded-full color-invert reload-button px-10 py-4 text-semibold',
                isUpsellModal() && 'upsell-modal-button w-full'
            )}
            onClick={() => {
                onClose();
                action();
            }}
            color="norm"
            size="medium"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    const greyActionButton = (
        <Button
            className="create-account-button rounded-full reload-button px-10 py-4 text-semibold"
            onClick={() => {
                onClose();
                action();
            }}
            color="norm"
            size="medium"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    const secondaryActionButton = (
        <Button
            className="create-account-secondary-button rounded-full reload-button px-10 py-4 text-semibold"
            onClick={() => {
                onClose();
                action();
            }}
            size="medium"
        >
            {secondaryActionText[ctaModalType]}
        </Button>
    );

    const lowPressureActionButton = (
        <Button
            className="create-account-low-pressure-button rounded-full reload-button px-10 py-4 text-semibold"
            onClick={() => {
                onClose();
                action();
            }}
            size="medium"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    if (!showUpsellModalAfterMeeting) {
        return null;
    }

    const isEndCallUpsell = () => {
        return (
            ctaModalType === UpsellModalTypes.GuestAccount ||
            ctaModalType === UpsellModalTypes.FreeAccount ||
            ctaModalType === UpsellModalTypes.PaidAccount ||
            ctaModalType === UpsellModalTypes.HostFreeAccount ||
            ctaModalType === UpsellModalTypes.HostPaidAccount
        );
    };

    const redirectToDashboard = (ctaModalType: UpsellModalTypes) => {
        return (
            ctaModalType === UpsellModalTypes.Schedule ||
            ctaModalType === UpsellModalTypes.Room ||
            ctaModalType === UpsellModalTypes.PersonalMeeting ||
            ctaModalType === UpsellModalTypes.StartMeeting
        );
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

    const handleSubmit = async (score: number, feedbackOptions?: string[], comment?: string) => {
        const allFeedback: string[] = [];

        if (feedbackOptions && feedbackOptions.length > 0) {
            allFeedback.push(...feedbackOptions);
        }

        if (comment) {
            allFeedback.push(comment);
        }

        await submitFeedback({
            score: score,
            feedbackOptions: allFeedback,
        })
            .then(() => {
                setIsFinished(true);
            })
            .catch(() => {
                close();
                notifications.createNotification({
                    type: 'error',
                    text: c('Notification').t`Could not send feedback`,
                });
            });
    };

    const getIcon = () => {
        if (isEndCallUpsell()) {
            return (
                <img
                    src={upsellModalIcon}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                />
            );
        }

        if (isUpsellModal()) {
            return (
                <img
                    className="w-custom h-custom"
                    src={ctaModalType === UpsellModalTypes.Schedule ? upsellScheduleIcon : upsellRoomIcon}
                    alt=""
                    style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                />
            );
        }

        return (
            <img
                className="w-custom h-custom"
                src={scheduleIcon}
                alt=""
                style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
            />
        );
    };

    return (
        <TranslucentModal open={open} onClose={onClose}>
            <div
                className={clsx(
                    'flex flex-column justify-end items-center text-center pt-10 pb-10',
                    isUpsellModal() && 'max-w-custom'
                )}
                style={{ '--max-w-custom': '28.25rem' }}
            >
                {getIcon()}
                {isFinished && (
                    <>
                        <div className="flex flex-column gap-2 pt-10 pb-10">
                            <div className="cta-modal-title text-semibold color-norm">{c('Title').t`Thank you!`}</div>
                            <div className="cta-modal-subtitle color-weak">{c('Title')
                                .t`Your feedback has been submitted`}</div>
                        </div>
                        <div className="flex flex-column gap-2 items-center cta-modal-content-container w-full">
                            <Button
                                className="back-dashboard-button rounded-full py-4 text-semibold px-10"
                                onClick={() => {
                                    onClose();
                                }}
                                size="medium"
                            >
                                {c('Label').t`Back to dashboard`}
                            </Button>
                        </div>
                    </>
                )}
                {!isFinished && (
                    <>
                        <div
                            className={clsx(
                                'flex flex-column gap-2 pb-10',
                                !isUpsellModal() && 'pt-10',
                                isUpsellModal() && 'upsell-modal pt-6 meet-glow-effect relative'
                            )}
                        >
                            <div
                                className={clsx(
                                    'cta-modal-title color-norm',
                                    !isUpsellModal() && 'text-semibold',
                                    isUpsellModal() && 'upsell-modal-title font-arizona'
                                )}
                            >
                                {titles[ctaModalType]}
                            </div>
                            <div className="cta-modal-subtitle color-weak">{subtitles[ctaModalType]}</div>
                        </div>
                        <div className="flex flex-column gap-2 items-center cta-modal-content-container w-full">
                            <div
                                className={clsx(
                                    'flex flex-column md:flex-row gap-2 items-center justify-between',
                                    isUpsellModal() && 'w-full'
                                )}
                            >
                                {redirectToDashboard(ctaModalType) && (
                                    <SettingsLink
                                        className={clsx(isUpsellModal() && 'w-full')}
                                        path={'/dashboard'}
                                        target={'_blank'}
                                    >
                                        {actionButton}
                                    </SettingsLink>
                                )}
                                {ctaModalType === UpsellModalTypes.GuestAccount && (
                                    <>
                                        {greyActionButton}
                                        {secondaryActionButton}
                                    </>
                                )}
                                {ctaModalType === UpsellModalTypes.HostFreeAccount && <>{actionButton}</>}
                                {ctaModalType === UpsellModalTypes.FreeAccount && <>{lowPressureActionButton}</>}
                            </div>
                            {rejoin && (
                                <div className="w-full flex justify-center gap-2 pt-10 pb-5 text-semibold">
                                    <span className="color-weak">{c('Info').t`Left by mistake?`}</span>
                                    <InlineLinkButton
                                        className="rejoin-meeting-button"
                                        onClick={() => {
                                            rejoin();
                                            onClose();
                                        }}
                                    >{c('Action').t`Rejoin meeting`}</InlineLinkButton>
                                </div>
                            )}
                        </div>
                        {isUpsellModal() && (
                            <div className="sign-in-button-container flex flex-row items-baseline py-6">
                                {c('Go to sign in').jt`Already have an account? ${signIn}`}
                            </div>
                        )}
                        {meetFeedbackEnabled && rejoin && (
                            <div className="flex items-center gap-5 mt-20 mb-5 cta-modal-rating-container">
                                <span className="text-semibold text-left cta-modal-rating-label">{c('Label')
                                    .t`How was the call quality?`}</span>
                                <StarRating value={rating} onChange={SetRating}></StarRating>
                                {rating && rating >= 3 && (
                                    <Button
                                        className="submit-rating-button rounded-full reload-button py-3 px-10 text-semibold text-invert"
                                        onClick={() => {
                                            onClose();
                                            action();
                                        }}
                                        color="weak"
                                        size="medium"
                                    >
                                        {c('Action').t`Submit`}
                                    </Button>
                                )}
                            </div>
                        )}
                        {rating && rating < 3 && (
                            <>
                                <div className="cta-modal-title text-semibold color-norm pt-10 pb-10">{c('Title')
                                    .t`What went wrong?`}</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                                    <FeedbackOptionColumn
                                        options={audioOptions}
                                        selectedOptions={selectedOptions}
                                        onOptionSelect={(option: string) => {
                                            if (selectedOptions.includes(option)) {
                                                setSelectedOptions(selectedOptions.filter((o) => o !== option));
                                            } else {
                                                setSelectedOptions([...selectedOptions, option]);
                                            }
                                        }}
                                    />
                                    <FeedbackOptionColumn
                                        options={videoOptions}
                                        selectedOptions={selectedOptions}
                                        onOptionSelect={(option: string) => {
                                            if (selectedOptions.includes(option)) {
                                                setSelectedOptions(selectedOptions.filter((o) => o !== option));
                                            } else {
                                                setSelectedOptions([...selectedOptions, option]);
                                            }
                                        }}
                                    />
                                    <FeedbackOptionColumn
                                        options={screenShareOptions}
                                        selectedOptions={selectedOptions}
                                        onOptionSelect={(option: string) => {
                                            if (selectedOptions.includes(option)) {
                                                setSelectedOptions(selectedOptions.filter((o) => o !== option));
                                            } else {
                                                setSelectedOptions([...selectedOptions, option]);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-full flex flex-nowrap items-center justify-start gap-2 text-semibold mt-7">
                                    <InlineLinkButton
                                        className="flex add-details-button items-center gap-2"
                                        onClick={() => setOptionalDetails(!optionalDetails)}
                                    >
                                        <IcPlus />
                                        {c('Label').t`Add optional details`}
                                    </InlineLinkButton>
                                </div>
                                {optionalDetails && (
                                    <div className="mt-4 w-full">
                                        <InputFieldTwo
                                            className="feedback-comment w-full md:w-2/3"
                                            as={TextAreaTwo}
                                            rows={3}
                                            value={comment}
                                            onValue={setComment}
                                            placeholder={c('Placeholder').t`Share more details`}
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 cta-modal-rating-container">
                                    <Button
                                        className="submit-rating-button rounded-full reload-button py-3 px-10 text-semibold"
                                        onClick={async () => {
                                            await withLoadingSkip(
                                                handleSubmit(rating, selectedOptions, optionalDetails ? comment : '')
                                            );
                                        }}
                                        color="weak"
                                        size="medium"
                                        loading={isLoadingSkip}
                                        disabled={isLoadingSkip || isLoading}
                                    >
                                        {c('Action').t`Skip`}
                                    </Button>
                                    <Button
                                        className="submit-rating-button-secondary rounded-full reload-button py-3 px-10 text-semibold"
                                        onClick={async () => {
                                            await withLoading(handleSubmit(rating));
                                        }}
                                        color="norm"
                                        size="medium"
                                        loading={isLoading}
                                        disabled={isLoading || isLoadingSkip}
                                    >
                                        {c('Action').t`Submit`}
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </TranslucentModal>
    );
};
