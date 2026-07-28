import { c } from 'ttag';

import { TruncatedTextWithTooltip } from '../../atoms/TruncatedTextWithTooltip/TruncatedTextWithTooltip';

type Props = {
    meetingName: string;
    instantMeeting: boolean;
    isPersonalRoom: boolean;
};

export const PreJoinDetailsHeader = ({ meetingName, instantMeeting, isPersonalRoom = false }: Props) => {
    const getTitle = () => {
        if (meetingName) {
            return meetingName;
        }

        if (instantMeeting) {
            return c('Title').t`Talk confidentially`;
        }

        return c('Title').t`Join meeting`;
    };

    const getSubtitle = () => {
        if (isPersonalRoom) {
            return c('Info').t`Your always available meeting room`;
        }

        if (instantMeeting) {
            return c('Info').t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`;
        }

        return c('Info').t`You've been invited to join a secure meeting. Confirm your name and click below to enter.`;
    };

    return (
        <div className="pre-join-details-header flex flex-column gap-2 py-2 lg:py-4 w-full">
            <h1
                className={`title text-semibold hidden md:flex justify-center m-0 w-full ${isPersonalRoom ? 'color-primary' : ''}`}
            >
                <TruncatedTextWithTooltip label={getTitle()} className="min-w-0 text-left" />
            </h1>
            <div className="text-center color-weak hidden md:block">{getSubtitle()}</div>
        </div>
    );
};
