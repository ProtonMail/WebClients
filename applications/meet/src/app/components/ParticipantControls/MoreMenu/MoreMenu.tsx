import { c } from 'ttag';

import { Popper } from '@proton/atoms/Popper/Popper';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMeetLiveCaptions } from '@proton/icons/icons/IcMeetLiveCaptions';
import { IcMeetRecord } from '@proton/icons/icons/IcMeetRecord';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { IcMeetTranscription } from '@proton/icons/icons/IcMeetTranscription';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/meetingInfo';
import {
    MeetingSideBars,
    selectMeetingReadyPopupOpen,
    selectSideBarState,
    selectTranscriptionEnabled,
    setMeetingReadyPopupOpen,
    toggleSideBarState,
    toggleTranscription,
} from '@proton/meet/store/slices/uiStateSlice';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { CircleButton } from '../../../atoms/CircleButton/CircleButton';
import { useDebugOverlayContext } from '../../../contexts/DebugOverlayContext';
import { useLiveCaptionsFeatureEnabled } from '../../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { MeetingReadyPopup } from '../../MeetingReadyPopup/MeetingReadyPopup';
import { useLayoutOptions } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { StopRecordingButton } from '../../RecordingControls/StopRecordingButton';
import { useRecordingToggle } from '../../RecordingControls/useRecordingToggle';
import { useLiveCaptionsToggle } from '../../Settings/useLiveCaptionsToggle';
import type { MoreMenuAction, MoreMenuToggle } from './MoreMenuItems';
import { MoreMenuPopup } from './MoreMenuPopup';
import { MoreMenuSheet } from './MoreMenuSheet';

import './MoreMenu.scss';

interface Props {
    variant: 'popup' | 'sheet';
    onOpenDeviceState: () => void;
    showMeetingActions?: boolean;
}

export const MoreMenu = ({ variant, onOpenDeviceState, showMeetingActions }: Props) => {
    const dispatch = useMeetDispatch();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { viewportWidth } = useActiveBreakpoint();

    const isTranscriptionFeatureEnabled = useFlag('MeetTranscription');
    const isParticipantsLayoutsEnabled = useFlag('MeetParticipantsLayouts');
    const isLiveCaptionsFeatureEnabled = useLiveCaptionsFeatureEnabled();
    const { isEnabled: isDebugEnabled, open: openDebugOverlay } = useDebugOverlayContext();

    const transcriptionEnabled = useMeetSelector(selectTranscriptionEnabled);
    const meetingReadyPopupOpen = useMeetSelector(selectMeetingReadyPopupOpen);
    const meetingLink = useMeetSelector(selectMeetingLink);
    const sideBarState = useMeetSelector(selectSideBarState);

    const recording = useRecordingToggle();
    const liveCaptions = useLiveCaptionsToggle();
    const layoutOptions = useLayoutOptions();
    const layout = isParticipantsLayoutsEnabled && layoutOptions.options.length > 1 ? layoutOptions : undefined;

    // MeetingBody renders the slide-up variant on xsmall screens.
    const showMeetingReadyPopup = meetingReadyPopupOpen && !viewportWidth.xsmall;

    const { floating, position } = usePopper({
        reference: {
            mode: 'element',
            value: anchorRef.current,
        },
        isOpen: showMeetingReadyPopup,
        originalPlacement: 'top',
        availablePlacements: ['top'],
        offset: 16,
    });

    const toggles: MoreMenuToggle[] = [
        recording.isVisible && {
            id: 'recording',
            Icon: IcMeetRecord,
            label: c('Action').t`Recording`,
            checked: recording.checked,
            disabled: recording.disabled,
            tooltip: recording.tooltip,
            onChange: recording.onChange,
        },
        isTranscriptionFeatureEnabled && {
            id: 'transcription',
            Icon: IcMeetTranscription,
            label: c('Action').t`Transcription`,
            checked: transcriptionEnabled,
            onChange: () => dispatch(toggleTranscription()),
        },
        isLiveCaptionsFeatureEnabled && {
            id: 'live-captions',
            Icon: IcMeetLiveCaptions,
            label: c('Action').t`Live captions`,
            checked: liveCaptions.checked,
            loading: liveCaptions.loading,
            disabled: liveCaptions.disabled,
            tooltip: liveCaptions.tooltip,
            onChange: liveCaptions.onChange,
        },
    ].filter(isTruthy);

    const actions: MoreMenuAction[] = [
        {
            id: 'settings',
            Icon: IcMeetSettings,
            label: c('Action').t`Settings`,
            onClick: () => {
                if (!sideBarState[MeetingSideBars.Settings]) {
                    sendMeetActionsEvent(TelemetryMeetActionsEvents.settings_opened, { source: 'more_menu' });
                }
                dispatch(toggleSideBarState(MeetingSideBars.Settings));
            },
        },
        {
            id: 'meeting-info',
            Icon: IcInfoCircle,
            label: c('Action').t`Meeting info`,
            onClick: () => dispatch(toggleSideBarState(MeetingSideBars.MeetingDetails)),
        },
        isDebugEnabled && {
            id: 'debug-overlay',
            Icon: IcBug,
            label: c('Action').t`Debug overlay`,
            onClick: openDebugOverlay,
        },
        isDebugEnabled && {
            id: 'debug-devices',
            Icon: IcBug,
            label: c('Action').t`Debug devices`,
            onClick: onOpenDeviceState,
        },
    ].filter(isTruthy);

    const getVariant = () => {
        if (isOpen) {
            return 'active';
        }

        if (showMeetingReadyPopup) {
            return 'highlight';
        }

        return 'default';
    };

    const handleToggle = () => {
        if (!isOpen && meetingReadyPopupOpen) {
            dispatch(setMeetingReadyPopupOpen(false));
        }
        toggle();
    };

    return (
        <>
            {recording.isVisible && recording.checked && (
                <StopRecordingButton duration={recording.duration} onClick={recording.onStop} />
            )}
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={IcThreeDotsVertical}
                onClick={handleToggle}
                variant={getVariant()}
                ariaLabel={c('Alt').t`More options`}
                ariaExpanded={isOpen}
                ariaHasPopup="true"
                tooltipTitle={isOpen ? undefined : c('Info').t`More options`}
            />
            {variant === 'popup' ? (
                <MoreMenuPopup
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                    toggles={toggles}
                    actions={actions}
                    layout={layout}
                    showMeetingActions={showMeetingActions}
                />
            ) : (
                isOpen && <MoreMenuSheet onClose={close} toggles={toggles} actions={actions} layout={layout} />
            )}
            <Popper
                className="fixed w-fit-content h-fit-content z-up"
                divRef={floating}
                isOpen={showMeetingReadyPopup}
                style={position}
            >
                <MeetingReadyPopup meetingLink={meetingLink} closeBySlide={false} />
            </Popper>
            {recording.modals}
            {liveCaptions.modals}
        </>
    );
};
