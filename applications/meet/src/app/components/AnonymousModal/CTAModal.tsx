import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { CALENDAR_APP_NAME, MEET_APP_NAME } from '@proton/shared/lib/constants';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';
import useFlag from '@proton/unleash/useFlag';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';

import './CTAModal.scss';

interface CTAModalProps {
    onClose: () => void;
    ctaModalType: UpsellModalTypes;
    rejoin?: () => void;
    action: () => void;
}

export const CTAModal = ({ onClose, ctaModalType, rejoin, action }: CTAModalProps) => {
    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');
    const titles = {
        [UpsellModalTypes.Schedule]: c('Info').t`Schedule your next meeting`,
        [UpsellModalTypes.Room]: c('Info').t`Create a meeting room`,
        [UpsellModalTypes.PersonalMeeting]: c('Info').t`Get your personal meeting ID`,
        [UpsellModalTypes.StartMeeting]: c('Info').t`Host your own secure meeting`,
        [UpsellModalTypes.FreeAccount]: c('Info').t`Meet without restrictions`,
        [UpsellModalTypes.PaidAccount]: c('Info').t`We hope you enjoyed your secure meeting!`,
    };

    const subtitles = {
        [UpsellModalTypes.Schedule]: c('Info')
            .t`Create an account to connect Meet with ${CALENDAR_APP_NAME} and send meeting invites instantly.`,
        [UpsellModalTypes.Room]: c('Info').t`Create an account to have a meeting room that you can use at any time.`,
        [UpsellModalTypes.PersonalMeeting]: c('Info')
            .t`Create an account to have a personal meeting link you can reuse for every call.`,
        [UpsellModalTypes.StartMeeting]: c('Info')
            .t`Start a call in ${MEET_APP_NAME} and share the link to invite anyone to join. Simple, secure, and free.`,
        [UpsellModalTypes.FreeAccount]: c('Info')
            .t`Upgrade to remove the 1-hour limit and skip the countdown. Enjoy meetings up to 24 hours.`,
        [UpsellModalTypes.PaidAccount]: c('Info')
            .t`To protect your organization, invite your team to use ${MEET_APP_NAME}.`,
    };

    const actionText = {
        [UpsellModalTypes.Schedule]: c('Action').t`Create a free account`,
        [UpsellModalTypes.Room]: c('Action').t`Create a free account`,
        [UpsellModalTypes.PersonalMeeting]: c('Action').t`Create a free account`,
        [UpsellModalTypes.StartMeeting]: c('Action').t`Start a meeting`,
        [UpsellModalTypes.FreeAccount]: c('Action').t`Get Meet Professional`,
        [UpsellModalTypes.PaidAccount]: undefined,
    };

    const actionButton = (
        <Button
            className="create-account-button rounded-full color-invert reload-button py-4 text-semibold w-full"
            onClick={() => {
                onClose();
                action();
            }}
            color="norm"
            size="large"
        >
            {actionText[ctaModalType]}
        </Button>
    );

    if (!showUpsellModalAfterMeeting) {
        return null;
    }

    return (
        <ModalTwo open={true} rootClassName="bg-transparent anonymous-modal" className="meet-radius border border-norm">
            <div
                className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                <CloseButton
                    onClose={onClose}
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                />
                <img
                    className="w-custom h-custom mb-2"
                    src={scheduleIcon}
                    alt=""
                    style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                />

                <div className="text-3xl text-semibold">{titles[ctaModalType]}</div>
                <div className="color-weak">{subtitles[ctaModalType]}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    {ctaModalType === UpsellModalTypes.FreeAccount && (
                        <SettingsLink path={'/dashboard'} target={'_blank'}>
                            {actionButton}
                        </SettingsLink>
                    )}
                    {ctaModalType === UpsellModalTypes.PaidAccount && (
                        <div className="h-custom" style={{ '--h-custom': '1.5rem' }} />
                    )}
                    {ctaModalType !== UpsellModalTypes.FreeAccount && ctaModalType !== UpsellModalTypes.PaidAccount && (
                        <>{actionButton}</>
                    )}

                    {rejoin && (
                        <div className="w-full flex justify-center gap-2">
                            <span className="color-weak">{c('Info').t`Left by mistake?`}</span>
                            <InlineLinkButton className="rejoin-meeting-button" onClick={rejoin}>{c('Action')
                                .t`Rejoin meeting`}</InlineLinkButton>
                        </div>
                    )}
                </div>
            </div>
        </ModalTwo>
    );
};
