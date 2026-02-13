import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import linkIcon from '@proton/styles/assets/img/meet/link.png';
import clsx from '@proton/utils/clsx';

import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

import './JoinWithLinkModal.scss';

interface JoinWithLinkModalProps {
    open: boolean;
    onClose: () => void;
    onJoin: (meetingId: string, meetingPassword: string) => void;
}

export const JoinWithLinkModal = ({ open, onClose, onJoin }: JoinWithLinkModalProps) => {
    const [meetingLink, setMeetingLink] = useState('');

    const getMeetingParams = () => {
        try {
            const { meetingId, urlPassword } = parseMeetingLink(meetingLink);

            return { meetingId, urlPassword };
        } catch (error) {
            return { meetingId: null, urlPassword: null };
        }
    };

    const { meetingId, urlPassword } = getMeetingParams();
    const canJoin = meetingId && urlPassword;

    const onResetAndClose = () => {
        setMeetingLink('');
        onClose();
    };

    const isError = meetingLink && !canJoin;

    return (
        <TranslucentModal open={open} onClose={onResetAndClose}>
            <div className="join-with-link-modal flex flex-column justify-end items-center gap-4 text-center">
                <img
                    src={linkIcon}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '6rem', '--h-custom': '6rem' }}
                />
                <div className="h1 text-semibold">{c('Title').t`Join a meeting`}</div>
                <div className="text-2xl color-weak">{c('Info')
                    .t`Paste your ${MEET_APP_NAME} link to join a secure meeting`}</div>
                <div className="flex flex-column w-full">
                    <div className={clsx('flex items-center w-full justify-start flex-nowrap gap-2 my-8')}>
                        <img
                            src={linkIcon}
                            alt=""
                            className="w-custom h-custom"
                            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                        />
                        <Input
                            className="meeting-link-input rounded-full p-2"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.proton.me/join/id-abc#pwd-123"
                            error={isError}
                        />
                    </div>
                    {isError && (
                        <span className="meeting-link-input-error text-left text-sm color-danger ml-11 mb-2">{c('Error')
                            .t`Invalid meeting link`}</span>
                    )}
                </div>
                <Button
                    className="join-button rounded-full border-none py-4 w-full text-semibold"
                    onClick={() => {
                        if (canJoin) {
                            onClose();
                            onJoin(meetingId, urlPassword);
                        }
                    }}
                    size="large"
                    disabled={!canJoin}
                >
                    {c('Action').t`Join meeting`}
                </Button>
            </div>
        </TranslucentModal>
    );
};
