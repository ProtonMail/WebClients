import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCheckmark, IcCross } from '@proton/icons';

import { useUIStateContext } from '../../contexts/UIStateContext';

import './MeetingReadyPopup.scss';

interface MeetingReadyPopupProps {
    meetingLink: string;
}

export const MeetingReadyPopup = ({ meetingLink }: MeetingReadyPopupProps) => {
    const [showNotifications, setShowNotifications] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { meetingReadyPopupOpen, setMeetingReadyPopupOpen } = useUIStateContext();

    useEffect(() => {
        if (showNotifications) {
            timeoutRef.current = setTimeout(() => {
                setShowNotifications(false);
            }, 2000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [showNotifications]);

    if (!meetingReadyPopupOpen) {
        return null;
    }

    return (
        <div
            className="absolute bottom-custom left-custom"
            style={{ '--bottom-custom': '7.25rem', '--left-custom': '1.75rem' }}
        >
            <div
                className="meeting-ready-popup meet-radius bg-norm rounded-lg p-6 relative flex flex-column items-center w-custom h-custom p-4"
                style={{
                    '--w-custom': '24.5rem',
                    '--h-custom': '20.1875rem',
                }}
            >
                <Button
                    className="absolute top-custom right-custom color-weak"
                    size="small"
                    onClick={() => setMeetingReadyPopupOpen(false)}
                    shape="ghost"
                    style={{ '--top-custom': '0.5rem', '--right-custom': '0.5rem' }}
                    aria-label={c('l10n_nightly Action').t`Close popup`}
                >
                    <IcCross size={4} />
                </Button>
                <div className="meeting-ready-popup-title text-3xl text-center text-semibold">{c('l10n_nightly Info')
                    .t`Your meeting is ready`}</div>

                <div className="color-weak text-center">{c('l10n_nightly Info')
                    .t`Share this link to invite others. You can also find it anytime by clicking the info icon in the toolbar.`}</div>

                <div className="meeting-ready-popup-meeting-link flex flex-column w-full items-start">
                    <div className="color-weak">{c('l10n_nightly Info').t`Meeting link`}</div>
                    <div className="meeting-ready-popup-meeting-link-text w-full">{meetingLink}</div>
                </div>

                <div className="absolute bottom-custom w-full px-6" style={{ '--bottom-custom': '1rem' }}>
                    <Button
                        className="copy-meeting-link-button mx-auto w-full rounded-full border-none py-4 flex justify-center items-center gap-1"
                        size="large"
                        onClick={() => {
                            void navigator.clipboard.writeText(meetingLink);
                            setShowNotifications(true);
                        }}
                    >
                        {showNotifications ? c('l10n_nightly Action').t`Copied` : c('l10n_nightly Action').t`Copy link`}
                        {showNotifications && <IcCheckmark size={5} />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
