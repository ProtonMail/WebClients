import { c } from 'ttag';

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
            style={{ '--bottom-custom': '7.25rem' }}
        >
            <div
                className="meeting-ready-popup meet-radius bg-norm rounded-lg p-8 md:p-6 relative flex flex-column items-center w-full md:w-custom md:h-custom"
                style={{
                    '--md-w-custom': '24.5rem',
                    '--md-h-custom': '20.1875rem',
                }}
            >
                <CloseButton
                    onClose={() => setMeetingReadyPopupOpen(false)}
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '0.5rem', '--right-custom': '0.5rem' }}
                />
                <div className="meeting-ready-popup-title text-3xl text-center text-semibold">{c('Info')
                    .t`Your meeting is ready`}</div>

                <div className="color-weak text-center">{c('Info')
                    .t`Share this link to invite others. You can also find it anytime by clicking the info icon in the toolbar.`}</div>

                <div className="meeting-ready-popup-meeting-link flex flex-column w-full items-start">
                    <div className="color-weak">{c('Info').t`Meeting link`}</div>
                    <div className="meeting-ready-popup-meeting-link-text w-full">{meetingLink}</div>
                </div>

                <div className="absolute bottom-custom w-full px-6" style={{ '--bottom-custom': '1rem' }}>
                    <CopyButton text={meetingLink} />
                </div>
            </div>
        </div>
    );
};
