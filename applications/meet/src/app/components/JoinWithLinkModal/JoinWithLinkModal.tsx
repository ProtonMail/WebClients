import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { parseMeetingLink } from '@proton/shared/lib/meet/parseMeetingLink';
import linkIcon from '@proton/styles/assets/img/meet/link.png';
import clsx from '@proton/utils/clsx';

import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

import './JoinWithLinkModal.scss';

// Example link shown as the field's placeholder. VoiceOver/iOS read the native
// `placeholder` attribute aloud by design (via the AXPlaceholderValue API), and
// no ARIA attribute suppresses that. To keep the visual placeholder without
// having the full URL read out, the attribute is only present while the field is
// blurred and removed on focus (when screen readers announce the field).
const MEETING_LINK_PLACEHOLDER = 'https://meet.proton.me/join/id-abc#pwd-123';

interface JoinWithLinkModalProps {
    open: boolean;
    onClose: () => void;
    onJoin: (meetingId: string, meetingPassword: string) => void;
}

export const JoinWithLinkModal = ({ open, onClose, onJoin }: JoinWithLinkModalProps) => {
    const [meetingLink, setMeetingLink] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

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

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canJoin) {
            return;
        }
        onClose();
        onJoin(meetingId, urlPassword);
    };

    const onResetAndClose = () => {
        setMeetingLink('');
        onClose();
    };

    const isError = meetingLink && !canJoin;

    return (
        <TranslucentModal open={open} onClose={onResetAndClose}>
            <form
                className="join-with-link-modal flex flex-column justify-end items-center text-center md:w-custom"
                style={{ '--md-w-custom': '33em' }}
                onSubmit={onSubmit}
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
                <div className="flex flex-column w-full relative">
                    <div className={clsx('flex items-center w-full justify-start flex-nowrap gap-2 my-4')}>
                        <img
                            src={linkIcon}
                            alt=""
                            className="w-custom h-custom"
                            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                        />
                        <Input
                            className="meeting-link-input rounded-full p-2"
                            type="url"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder={isInputFocused ? undefined : MEETING_LINK_PLACEHOLDER}
                            aria-label={c('Label').t`Meeting link`}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            error={isError}
                            autoFocus
                            suffix={
                                <Button
                                    className="action-button-new color-norm rounded-full flex-1 md:flex-none flex items-center justify-center"
                                    style={{ 'margin-inline-end': '-0.75rem' }}
                                    onClick={async () => setMeetingLink(await navigator.clipboard.readText())}
                                >
                                    {c('Action').t`Paste`}
                                </Button>
                            }
                        />
                    </div>
                    {isError && (
                        <span className="meeting-link-input-error absolute text-left text-sm color-danger ml-11 mb-2">{c(
                            'Error'
                        ).t`Invalid meeting link`}</span>
                    )}
                </div>
                <div className="flex flex-column md:flex-row gap-4 w-full py-10">
                    <Button
                        type="button"
                        className="tertiary rounded-full py-4 md:flex-1 text-semibold"
                        onClick={onResetAndClose}
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button
                        type="submit"
                        className="primary rounded-full border-none py-4 md:flex-1 text-semibold"
                        disabled={!canJoin}
                    >
                        {c('Action').t`Join meeting`}
                    </Button>
                </div>
            </form>
        </TranslucentModal>
    );
};
