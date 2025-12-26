import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useLoading from '@proton/hooks/useLoading';
import { IcMeetPhone } from '@proton/icons/icons/IcMeetPhone';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { MeetingSideBars, PopUpControls } from '../../types';
import { LeaveMeetingWarningModal } from '../LeaveMeetingWarningModal/LeaveMeetingWarningModal';
import { ScreenShareLeaveWarningModal } from '../ScreenShareLeaveWarningModal/ScreenShareLeaveWarningModal';

import './LeaveMeetingPopup.scss';

export const LeaveMeetingPopup = () => {
    const allowNewHostAssignment = useFlag('MeetAllowNewHostAssignment');

    const { anchorRef } = usePopperAnchor<HTMLButtonElement>();
    const { handleEndMeeting, handleLeave, isLocalScreenShare } = useMeetContext();
    const { toggleSideBarState, popupState, togglePopupState, setPopupStateValue } = useUIStateContext();
    const [loadingEndMeeting, withLoadingEndMeeting] = useLoading();

    const isLargerThanMd = useIsLargerThanMd();

    const { isLocalParticipantHost, isLocalParticipantAdmin, hasAnotherAdmin, hostIsPresent } =
        useIsLocalParticipantAdmin();

    const handleButtonClick = () => {
        if (isLocalScreenShare) {
            setPopupStateValue(PopUpControls.ScreenShareLeaveWarning, true);
        } else if (
            (isLocalParticipantHost && !hasAnotherAdmin) ||
            (isLocalParticipantAdmin && !hasAnotherAdmin && !hostIsPresent)
        ) {
            togglePopupState(PopUpControls.LeaveMeeting);
        } else {
            togglePopupState(PopUpControls.LeaveMeetingParticipant);
        }
    };

    const handleClose = () => {
        setPopupStateValue(PopUpControls.LeaveMeeting, false);
    };

    const handleConfirm = (controls: PopUpControls) => {
        setPopupStateValue(controls, false);
        handleLeave();
    };

    return (
        <>
            <Button
                ref={anchorRef}
                className={clsx(isLargerThanMd ? 'px-8 py-4' : 'px-7 py-3', 'leave-button border-none shrink-0')}
                pill={true}
                size="large"
                onClick={handleButtonClick}
                aria-label={c('Alt').t`Leave Meeting`}
            >
                {isLargerThanMd ? c('Alt').t`Leave` : <IcMeetPhone className="shrink-0" size={8} />}
            </Button>
            <Dropdown
                className="meet-radius"
                isOpen={popupState[PopUpControls.LeaveMeeting]}
                anchorRef={anchorRef}
                onClose={handleClose}
                originalPlacement="top-start"
                availablePlacements={['top-start', 'top', 'top-end', 'bottom-start', 'bottom', 'bottom-end']}
                size={{ width: '24.5rem', maxWidth: '24.5rem' }}
            >
                <div className="px-4 pb-4 pt-2 flex flex-column flex-nowrap gap-2">
                    <div className="w-full flex justify-end">
                        <CloseButton onClose={handleClose} />
                    </div>

                    <Button
                        className="end-meeting-for-all-button border-none rounded-full w-full py-4"
                        onClick={() => withLoadingEndMeeting(handleEndMeeting)}
                        disabled={loadingEndMeeting}
                        loading={loadingEndMeeting}
                        size="large"
                    >
                        {c('Action').t`End meeting for all`}
                    </Button>
                    <Button
                        className="leave-meeting-button border-none rounded-full w-full py-4"
                        onClick={() => handleLeave()}
                        size="large"
                    >
                        {c('Action').t`Leave meeting`}
                    </Button>
                    {allowNewHostAssignment && (
                        <Button
                            className="assign-new-host-button border-none rounded-full w-full py-4"
                            onClick={() => {
                                toggleSideBarState(MeetingSideBars.AssignHost);
                                handleClose();
                            }}
                            disabled={loadingEndMeeting}
                            size="large"
                        >
                            {c('Action').t`Assign new host`}
                        </Button>
                    )}
                </div>
            </Dropdown>
            {popupState[PopUpControls.ScreenShareLeaveWarning] && (
                <ScreenShareLeaveWarningModal
                    onClose={() => setPopupStateValue(PopUpControls.ScreenShareLeaveWarning, false)}
                    onConfirm={() => handleConfirm(PopUpControls.ScreenShareLeaveWarning)}
                />
            )}
            {popupState[PopUpControls.LeaveMeetingParticipant] && (
                <LeaveMeetingWarningModal
                    onClose={() => setPopupStateValue(PopUpControls.LeaveMeetingParticipant, false)}
                    onConfirm={() => handleConfirm(PopUpControls.LeaveMeetingParticipant)}
                />
            )}
        </>
    );
};
