import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingReadyPopupOpen, setMeetingReadyPopupOpen } from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { SlideClosable } from '../SlideClosable/SlideClosable';

import './MeetingReadyPopup.scss';

interface MeetingReadyPopupProps {
    meetingLink: string;
    closeBySlide?: boolean;
}

export const MeetingReadyPopup = ({ meetingLink, closeBySlide }: MeetingReadyPopupProps) => {
    const dispatch = useMeetDispatch();
    const meetingReadyPopupOpen = useMeetSelector(selectMeetingReadyPopupOpen);

    const notifications = useNotifications();

    const WrapperComponent = useMemo(
        () =>
            closeBySlide
                ? SlideClosable
                : ({ children, className }: { children: React.ReactNode; className?: string }) => (
                      <div className={className}>{children}</div>
                  ),
        [closeBySlide]
    );

    if (!meetingReadyPopupOpen) {
        return null;
    }

    return (
        <WrapperComponent className="meeting-ready-popup-container" onClose={() => setMeetingReadyPopupOpen(false)}>
            <div
                className="meeting-ready-popup large-meet-radius rounded-lg p-4 md:p-6 relative flex flex-column items-center w-full sm:w-custom md:h-fit-content gap-6 border border-weak w-max-custom"
                style={{
                    '--sm-w-custom': '24.5rem',
                }}
            >
                {!isMobile() && (
                    <CloseButton
                        onClose={() => dispatch(setMeetingReadyPopupOpen(false))}
                        className="absolute top-custom right-custom"
                        style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                    />
                )}

                <div className="flex flex-column items-center gap-2">
                    <div className="text-3xl text-center text-semibold">{c('Info').t`Your meeting is ready`}</div>

                    <div className="color-weak text-center">{c('Info')
                        .t`Share this link to invite others. You can also find it anytime by clicking the info icon in the toolbar.`}</div>
                </div>

                <div className="link-container flex flex-column bg-norm border border-norm p-6">
                    <div className="color-weak">{c('Info').t`Meeting link`}</div>
                    <Href href={meetingLink} className="meeting-ready-popup-meeting-link text-break-all">
                        {meetingLink}
                    </Href>
                </div>

                <Button
                    className="copy-meeting-link-button w-full rounded-full border-none p-4 flex justify-center items-center gap-1"
                    size="large"
                    onClick={async () => {
                        void navigator.clipboard.writeText(meetingLink);
                        dispatch(setMeetingReadyPopupOpen(false));
                        notifications.createNotification({
                            type: 'success',
                            text: c('Info').t`Link copied to clipboard`,
                            showCloseButton: false,
                        });
                    }}
                >
                    {c('Action').t`Copy link and close`}
                </Button>

                <div className="popup-caret"></div>
            </div>
        </WrapperComponent>
    );
};
