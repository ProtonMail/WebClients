import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { CopyButton } from '../../atoms/CopyButton/CopyButton';
import { useUIStateContext } from '../../contexts/UIStateContext';

import './MeetingReadyPopup.scss';

interface MeetingReadyPopupProps {
    meetingLink: string;
}

export const MeetingReadyPopup = ({ meetingLink }: MeetingReadyPopupProps) => {
    const { meetingReadyPopupOpen, setMeetingReadyPopupOpen } = useUIStateContext();

    if (!meetingReadyPopupOpen) {
        return null;
    }

    return (
        <div
            className="meeting-ready-popup-container absolute bottom-custom px-4 md:px-0"
            style={{ '--bottom-custom': '6.5rem' }}
        >
            <div
                className="meeting-ready-popup large-meet-radius bg-weak rounded-lg p-8 md:p-6 relative flex flex-column items-center w-full md:w-custom md:h-fit-content gap-6"
                style={{
                    '--md-w-custom': '24.5rem',
                }}
            >
                <CloseButton
                    onClose={() => setMeetingReadyPopupOpen(false)}
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                />
                <div className="flex flex-column items-center gap-2">
                    <div className="text-3xl text-center text-semibold">{c('Info').t`Your meeting is ready`}</div>

                    <div className="color-weak text-center">{c('Info')
                        .t`Share this link to invite others. You can also find it anytime by clicking the info icon in the toolbar.`}</div>
                </div>

                <div className="flex flex-column bg-norm border border-norm p-6 rounded-xl">
                    <div className="color-weak">{c('Info').t`Meeting link`}</div>
                    <Href href={meetingLink} className="meeting-ready-popup-meeting-link text-break-all">
                        {meetingLink}
                    </Href>
                </div>

                <CopyButton className="w-full" text={meetingLink} isPrimary={true} />
            </div>
        </div>
    );
};
