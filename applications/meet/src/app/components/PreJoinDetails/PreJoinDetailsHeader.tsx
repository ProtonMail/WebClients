import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { TruncatedTextWithTooltip } from '../../atoms/TruncatedTextWithTooltip/TruncatedTextWithTooltip';
import { PrejoinDetailsHeaderShell } from './shared/PrejoinDetailsHeaderShell';

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
        <PrejoinDetailsHeaderShell
            title={<TruncatedTextWithTooltip label={getTitle()} className="min-w-0 text-left" />}
            subtitle={getSubtitle()}
            titleClassName={clsx('justify-center w-full', isPersonalRoom && 'color-primary')}
        />
    );
};
