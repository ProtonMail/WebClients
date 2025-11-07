import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, TextAreaTwo } from '@proton/components';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';

import './JoinWithLinkModal.scss';

interface JoinWithLinkModalProps {
    onClose: () => void;
    onJoin: (meetingId: string, meetingPassword: string) => void;
}

export const JoinWithLinkModal = ({ onClose, onJoin }: JoinWithLinkModalProps) => {
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

    return (
        <ModalTwo
            open={true}
            className="join-with-link-modal flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden border border-norm"
            rootClassName="blurry-backdrop"
            style={{ '--pt-custom': '5rem' }}
        >
            <div className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full overflow-hidden">
                <CloseButton
                    onClose={onClose}
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                />
                <div className="text-center text-3xl text-semibold">{c('Title').t`Join a meeting`}</div>
                <div className="color-weak text-center">{c('Info')
                    .t`Paste your ${MEET_APP_NAME} link to join a secure meeting`}</div>
                <div
                    className="flex flex-column bg-weak border border-norm p-6 rounded-xl w-full justify-start h-custom flex-nowrap gap-1"
                    style={{ '--h-custom': '7rem' }}
                >
                    <label className="color-weak text-left">{c('Info').t`Meeting link`}</label>
                    <TextAreaTwo
                        className="meeting-link-textarea resize-none"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        // eslint-disable-next-line no-restricted-syntax
                        placeholder={c('Placeholder').t`https://meet.proton.me/join/id-abc#pwd-123`}
                        unstyled={true}
                    />
                </div>
                <Button
                    className="join-button rounded-full border-none py-4 w-full text-semibold"
                    onClick={() => {
                        if (meetingId && urlPassword) {
                            onJoin(meetingId, urlPassword);
                        }
                    }}
                    size="large"
                    disabled={!meetingId || !urlPassword}
                >
                    Join meeting
                </Button>
            </div>
        </ModalTwo>
    );
};
