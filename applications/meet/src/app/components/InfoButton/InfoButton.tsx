import { useRef } from 'react';

import { c } from 'ttag';

import Popper from '@proton/components/components/popper/Popper';
import usePopper from '@proton/components/components/popper/usePopper';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectMeetingReadyPopupOpen,
    selectSideBarState,
    toggleSideBarState,
} from '@proton/meet/store/slices/uiStateSlice';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { MeetingSideBars } from '../../types';
import { MeetingReadyPopup } from '../MeetingReadyPopup/MeetingReadyPopup';

export const InfoButton = () => {
    const dispatch = useMeetDispatch();
    const sideBarState = useMeetSelector(selectSideBarState);
    const meetingReadyPopupOpen = useMeetSelector(selectMeetingReadyPopupOpen);
    const { meetingLink } = useMeetContext();
    const anchorRef = useRef<HTMLButtonElement>(null);

    const { floating, position } = usePopper({
        reference: {
            mode: 'element',
            value: anchorRef.current,
        },
        isOpen: meetingReadyPopupOpen,
        originalPlacement: 'top',
        availablePlacements: ['top'],
        offset: 16,
    });

    const getVariant = () => {
        if (sideBarState[MeetingSideBars.MeetingDetails]) {
            return 'active';
        }

        if (meetingReadyPopupOpen) {
            return 'highlight';
        }

        return 'default';
    };

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={IcInfoCircle}
                onClick={() => dispatch(toggleSideBarState(MeetingSideBars.MeetingDetails))}
                variant={getVariant()}
                ariaLabel={c('Alt').t`Toggle meeting details`}
            />
            <Popper
                className="fixed w-fit-content h-fit-content z-up"
                divRef={floating}
                isOpen={meetingReadyPopupOpen}
                style={position}
            >
                <MeetingReadyPopup meetingLink={meetingLink} closeBySlide={false} />
            </Popper>
        </>
    );
};
