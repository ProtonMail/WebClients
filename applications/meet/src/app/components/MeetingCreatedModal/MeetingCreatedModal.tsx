import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { CreateMeetingParams } from '@proton/meet';
import { BRAND_NAME, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isSameDay } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';

import { CopyButton } from '../../atoms/CopyButton/CopyButton';

import './MeetingCreatedModal.scss';

const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(dateLocale.code, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return formatter.format(date).replace(/(\d+),/, '$1');
};

const formatTimeHHMM = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat(dateLocale.code, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return formatter.format(date);
};

interface MeetingCreatedModalProps {
    values: CreateMeetingParams;
    meetingLink: string;
    startTime: Date;
    endTime: Date;
    timeZone: string;
    id: string;
    onClose: () => void;
}

export const MeetingCreatedModal = ({
    meetingLink,
    startTime,
    endTime,
    timeZone,
    id,
    onClose,
}: MeetingCreatedModalProps) => {
    const [user] = useUser();

    const endsOnSameDay = isSameDay(endTime, startTime);

    const time = endsOnSameDay
        ? `${formatDate(startTime)}\n${formatTimeHHMM(startTime)} - ${formatTimeHHMM(endTime)} (${timeZone})`
        : `${formatDate(startTime)}\n${formatTimeHHMM(startTime)} (${timeZone})\n${formatDate(endTime)}\n${formatTimeHHMM(endTime)} (${timeZone})`;

    const inviteText = c('Info')
        .t`${user.DisplayName} has invited you to a ${BRAND_NAME} ${MEET_SHORT_APP_NAME} meeting:\n\n${time}\n\n${meetingLink}\n\nMeeting ID: ${id}`;

    return (
        <ModalTwo
            open={true}
            className="no-shadow meet-radius"
            rootClassName="meeting-created-modal-backdrop"
            onClose={onClose}
        >
            <ModalTwoHeader />
            <ModalTwoContent className="flex flex-column items-center justify-center">
                <div className="text-3xl text-semibold text-center mt-4">{c('Info').t`Meeting created`}</div>
                <div className="mt-6 mb-6 color-weak text-center">
                    {c('Info').t`Share the meeting invitation with others`}
                </div>
                <div
                    className="bg-weak border border-norm w-custom max-w-custom h-custom meet-radius flex flex-column items-start justify-space-between p-4 overflow-hidden"
                    style={{ '--w-custom': '20.5rem', '--max-w-custom': '20.5rem', '--h-custom': '16.9375rem' }}
                >
                    <div className="flex flex-column items-start">
                        <div className="color-weak">{c('Info').t`Invitation preview`}</div>
                        <div className="text-lg text-semibold">
                            {c('Info')
                                .t`${user.DisplayName} has invited you to a ${BRAND_NAME} ${MEET_SHORT_APP_NAME} meeting:`}
                        </div>
                    </div>

                    <div className="flex flex-column items-start">
                        {endsOnSameDay ? (
                            <div className="flex flex-column items-start color-weak">
                                <div>{formatDate(startTime)}</div>
                                <div>
                                    {formatTimeHHMM(startTime)} - {formatTimeHHMM(endTime)} ({timeZone})
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-column items-start color-weak">
                                <div>
                                    {formatDate(startTime)} {formatTimeHHMM(startTime)} ({timeZone})
                                </div>
                                <div>
                                    {formatTimeHHMM(endTime)} {formatTimeHHMM(endTime)} ({timeZone})
                                </div>
                            </div>
                        )}
                        <a className="meeting-link" href={meetingLink} target="_blank" rel="noopener noreferrer">
                            {meetingLink}
                        </a>
                    </div>

                    <div className="flex flex-column items-start">
                        <div>{c('Info').t`Meeting ID: ${id}`}</div>
                    </div>
                </div>
                <CopyButton
                    className="mt-4"
                    text={inviteText}
                    isPrimary={true}
                    title={c('Action').t`Copy invitation text`}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};
