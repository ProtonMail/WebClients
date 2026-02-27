import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { BRAND_NAME, MEET_APP_NAME } from '@proton/shared/lib/constants';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';
import upsellModalIcon from '@proton/styles/assets/img/meet/upsell-modal-icon.svg';
import upsellRoomIcon from '@proton/styles/assets/img/meet/upsell-room-icon.svg';
import upsellScheduleIcon from '@proton/styles/assets/img/meet/upsell-schedule-icon.svg';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { MeetSignIn } from '../SignIn/SignIn';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';
import { FeedbackForm } from './FeedbackForm';

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
        [UpsellModalTypes.GuestAccount]: guestAccountSubtitle,
        [UpsellModalTypes.FreeAccount]: c('Info')
            .t`Host your own secure meeting. Start a call in ${MEET_APP_NAME} and share the link to invite anyone to join. Simple, secure, and free.`,
        [UpsellModalTypes.PaidAccount]: c('Info').t`Thank you for joining.`,
    };

    const actionText = {
        [UpsellModalTypes.Schedule]: c('Action').t`Continue`,
        [UpsellModalTypes.Room]: c('Action').t`Continue`,
        [UpsellModalTypes.PersonalMeeting]: c('Action').t`Continue`,
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
                'rounded-full px-10 py-4 text-semibold primary w-full',
                isUpsellModal() && 'upsell-modal-button'
            )}
            onClick={() => {
                onClose();
                action();
            }}
            size="medium"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    const greyActionButton = (
        <Button
            className="secondary rounded-full px-10 py-4 text-semibold flex-auto w-full md:w-auto"
            onClick={() => {
                onClose();
                action();
            }}
            size="medium"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    const secondaryActionButton = (
        <Button
            className="tertiary rounded-full px-10 py-4 text-semibold flex-auto w-full md:w-auto"
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
            className="create-account-low-pressure-button rounded-full px-10 py-4 text-semibold"
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
            ctaModalType === UpsellModalTypes.PersonalMeeting
        );
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
                className={clsx('flex flex-column justify-end items-center text-center pt-10 pb-10 w-full')}
                style={{ '--max-w-custom': '32.75rem' }}
            >
                {getIcon()}
                {isFinished && (
                    <>
                        <div className="flex flex-column gap-2 pt-10 pb-10 max-w-custom">
                            <div className="cta-modal-title text-semibold color-norm">{c('Title').t`Thank you!`}</div>
                            <div className="cta-modal-subtitle color-weak">{c('Title')
                                .t`Your feedback has been submitted`}</div>
                        </div>
                        <div className="flex flex-column gap-2 items-center cta-modal-content-container w-full max-w-custom">
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
                                'flex flex-column gap-2 pb-10 max-w-custom',
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
                        <div className="flex flex-column gap-2 items-center cta-modal-content-container w-full max-w-custom">
                            <div className="flex flex-column md:flex-row gap-2 items-center w-full">
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
                            {isEndCallUpsell() && rejoin && (
                                <div className="w-full flex justify-center gap-2 pt-10 pb-5 text-semibold max-w-custom">
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
                            <div className="sign-in-button-container flex flex-row items-baseline py-6 max-w-custom">
                                {c('Go to sign in').jt`Already have an account? ${signIn}`}
                            </div>
                        )}
                        {meetFeedbackEnabled && isEndCallUpsell() && rejoin && (
                            <FeedbackForm onClose={onClose} setIsFinished={setIsFinished} />
                        )}
                    </>
                )}
            </div>
        </TranslucentModal>
    );
};
