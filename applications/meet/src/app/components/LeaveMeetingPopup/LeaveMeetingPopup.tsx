import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useLoading from '@proton/hooks/useLoading';
import { IcMeetPhone } from '@proton/icons/icons/IcMeetPhone';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    MeetingSideBars,
    PopUpControls,
    selectPopupState,
    setPopupStateValue,
    togglePopupState,
    toggleSideBarState,
} from '@proton/meet/store/slices/uiStateSlice';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { EndMeetingWarningModal } from '../EndMeetingWarningModal/EndMeetingWarningModal';
import { LeaveMeetingWarningModal } from '../LeaveMeetingWarningModal/LeaveMeetingWarningModal';
import { ScreenShareLeaveWarningModal } from '../ScreenShareLeaveWarningModal/ScreenShareLeaveWarningModal';

import './LeaveMeetingPopup.scss';

export const LeaveMeetingPopup = () => {
    const dispatch = useMeetDispatch();
    const allowNewHostAssignment = useFlag('MeetAllowNewHostAssignment');

    const { anchorRef } = usePopperAnchor<HTMLButtonElement>();
    const { handleEndMeeting, handleLeave, isLocalScreenShare } = useMeetContext();
    const { sortedParticipants } = useSortedParticipantsContext();
    const popupState = useMeetSelector(selectPopupState);
    const [loadingEndMeeting, withLoadingEndMeeting] = useLoading();

    const isLargerThanMd = useIsLargerThanMd();

    const { isLocalParticipantHost, isLocalParticipantAdmin, hasAnotherAdmin, hostIsPresent } =
        useIsLocalParticipantAdmin();

    const handleButtonClick = () => {
        switch (true) {
            case isLocalScreenShare:
                return dispatch(setPopupStateValue({ popup: PopUpControls.ScreenShareLeaveWarning, value: true }));
            // If there is only one participant, regardless of the role, show the leave meeting participant modal
            case sortedParticipants.length === 1:
                return dispatch(togglePopupState(PopUpControls.LeaveMeetingParticipant));

            // If the local participant is host and there is no other admin,
            // Or if the local participant is the only admin and the host is not present, show the selection dropdown
            case isLocalParticipantHost && !hasAnotherAdmin:
            case isLocalParticipantAdmin && !hasAnotherAdmin && !hostIsPresent:
                return dispatch(togglePopupState(PopUpControls.LeaveMeeting));
            default:
                dispatch(togglePopupState(PopUpControls.LeaveMeetingParticipant));
        }
    };

    const handleClose = () => {
        dispatch(setPopupStateValue({ popup: PopUpControls.LeaveMeeting, value: false }));
    };

    const handleConfirm = (controls: PopUpControls) => {
        dispatch(setPopupStateValue({ popup: controls, value: false }));
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
                {isLargerThanMd ? c('Action').t`Leave` : <IcMeetPhone className="shrink-0" size={8} />}
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
                        onClick={() => togglePopupState(PopUpControls.EndMeeting)}
                        disabled={loadingEndMeeting}
                        loading={loadingEndMeeting}
                        size="large"
                    >
                        {c('Action').t`End meeting for all`}
                    </Button>
                    <Button
                        className="leave-meeting-button border-none rounded-full w-full py-4"
                        onClick={() => togglePopupState(PopUpControls.LeaveMeetingParticipant)}
                        size="large"
                    >
                        {c('Action').t`Leave meeting`}
                    </Button>
                    {allowNewHostAssignment && sortedParticipants.length > 1 && (
                        <Button
                            className="assign-new-host-button border-none rounded-full w-full py-4"
                            onClick={() => {
                                dispatch(toggleSideBarState(MeetingSideBars.AssignHost));
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
                    onClose={() =>
                        dispatch(setPopupStateValue({ popup: PopUpControls.ScreenShareLeaveWarning, value: false }))
                    }
                    onConfirm={() => handleConfirm(PopUpControls.ScreenShareLeaveWarning)}
                />
            )}
            {popupState[PopUpControls.LeaveMeetingParticipant] && (
                <LeaveMeetingWarningModal
                    onClose={() =>
                        dispatch(setPopupStateValue({ popup: PopUpControls.LeaveMeetingParticipant, value: false }))
                    }
                    onConfirm={() => handleConfirm(PopUpControls.LeaveMeetingParticipant)}
                />
            )}
            {popupState[PopUpControls.EndMeeting] && (
                <EndMeetingWarningModal
                    onClose={() => dispatch(setPopupStateValue({ popup: PopUpControls.EndMeeting, value: false }))}
                    onConfirm={() => withLoadingEndMeeting(handleEndMeeting)}
                />
            )}
        </>
    );
};
