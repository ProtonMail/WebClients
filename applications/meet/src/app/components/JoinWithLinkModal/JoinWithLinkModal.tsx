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
            <div
                className="join-with-link-modal flex flex-column justify-end items-center text-center md:w-custom"
                style={{ '--md-w-custom': '33em' }}
            >
                <img
                    src={linkIcon}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.375rem', '--h-custom': '4.375rem' }}
                />
                <div className="flex flex-column items-center gap-3 py-10 w-full">
                    <h2 className="join-with-link-title h2 text-semibold">{c('Title').t`Join a meeting`}</h2>
                    <div className="join-with-link-subtitle color-weak">
                        {c('Info').t`Paste your ${MEET_APP_NAME} link to join a secure meeting`}
                    </div>
                </div>
                <div className="flex flex-column w-full">
                    <div className={clsx('flex items-center w-full justify-start flex-nowrap gap-2 my-4')}>
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
                            autoFocus
                        />
                    </div>
                    {isError && (
                        <span className="meeting-link-input-error text-left text-sm color-danger ml-11 mb-2">{c('Error')
                            .t`Invalid meeting link`}</span>
                    )}
                </div>
                <div className="flex flex-column md:flex-row gap-4 w-full py-10">
                    <Button className="tertiary rounded-full py-4 md:flex-1 text-semibold" onClick={onResetAndClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button
                        className="primary rounded-full border-none py-4 md:flex-1 text-semibold"
                        onClick={() => {
                            if (canJoin) {
                                onClose();
                                onJoin(meetingId, urlPassword);
                            }
                        }}
                        disabled={!canJoin}
                    >
                        {c('Action').t`Join meeting`}
                    </Button>
                </div>
            </div>
        </TranslucentModal>
    );
};
