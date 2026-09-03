import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectBackgroundBlur } from '@proton/meet/store/slices/backgroundSlice';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectMeetSettings, setDisableVideos, setPipEnabled, setSelfView } from '@proton/meet/store/slices/settings';
import {
    MeetingSideBars,
    selectShowDuration,
    selectSideBarState,
    toggleShowDuration,
    toggleSideBarState as toggleSideBarStateAction,
} from '@proton/meet/store/slices/uiStateSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { ConditionalTooltip } from '../../atoms/ConditionalTooltip/ConditionalTooltip';
import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { SideBarSection } from '../../atoms/SideBarSection/SideBarSection';
import { useBackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { useIsBackgroundEffectsSupported } from '../../contexts/BackgroundEffects/useIsBackgroundEffectsSupported';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { useLiveCaptionsFeatureEnabled } from '../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { BackgroundBlurToggle } from './BackgroundBlurToggle';
import { CaptionLanguageSelect } from './CaptionLanguageSelect';
import { LiveCaptionsHostAvailabilityToggle } from './LiveCaptionsHostAvailabilityToggle';
import { LiveCaptionsToggle } from './LiveCaptionsToggle';
import { NoiseCancellingToggle } from './NoiseCancellingToggle';
import { WaitingRoomToggle } from './WaitingRoomToggle';

import './Settings.scss';

export const Settings = () => {
    const dispatch = useMeetDispatch();
    const { disableVideos, selfView, pipEnabled, meetingLocked: isMeetingLocked } = useMeetSelector(selectMeetSettings);

    const { noiseFilter, toggleNoiseFilter } = useMediaManagementContext();
    const { toggleBackgroundBlur } = useBackgroundEffectsContext();
    const isBackgroundBlurSupported = useIsBackgroundEffectsSupported();
    const backgroundBlur = useMeetSelector(selectBackgroundBlur);
    const { handleMeetingLockToggle } = useMeetContext();
    const isLocalScreenShare = useMeetSelector(selectIsLocalScreenShare);

    const sideBarState = useMeetSelector(selectSideBarState);
    const showDuration = useMeetSelector(selectShowDuration);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const liveCaptionsEnabled = useLiveCaptionsFeatureEnabled();
    const { wantsCaptions } = useCaptionsPreference();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');
    const canPickCaptionLanguage = useFlag('MeetSaveCaptionLanguagePreference');

    const [loadingLock, withLoadingLock] = useLoading();
    const [loadingBackgroundBlur, withLoadingBackgroundBlur] = useLoading();

    const displayRef = useRef<HTMLDivElement>(null);
    const captionsWereOn = useRef(wantsCaptions);

    // The captions bar takes its height from the panel, which can push this section out of view.
    useEffect(() => {
        const justTurnedOn = wantsCaptions && !captionsWereOn.current;
        captionsWereOn.current = wantsCaptions;

        if (justTurnedOn) {
            displayRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [wantsCaptions]);

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarStateAction(MeetingSideBars.Settings))}
            aria-label={c('Aria').t`Settings`}
            absoluteHeader={true}
            paddingClassName="px-4 py-4"
            header={
                <div className="flex items-center">
                    <h2 className="text-xl text-semibold">{c('Title').t`Settings`}</h2>
                </div>
            }
        >
            {/* The header floats over the scroll region so the settings blur behind it, leaving the
                measured header height to keep the first section clear of it. */}
            <div
                className="overflow-y-auto flex-1 min-h-0 pt-custom"
                style={{ '--pt-custom': 'var(--side-bar-header-height)' }}
            >
                <div className="flex flex-column flex-nowrap w-full gap-2">
                    {isLocalParticipantAdminOrHost && (
                        <SideBarSection title={c('Title').t`Host settings`}>
                            <SettingToggle
                                id="lock-meeting"
                                label={c('Action').t`Lock meeting`}
                                ariaLabel={c('Alt').t`Lock meeting`}
                                onChange={() => {
                                    void withLoadingLock(handleMeetingLockToggle());
                                }}
                                checked={isMeetingLocked}
                                loading={loadingLock}
                            />
                            <WaitingRoomToggle />
                            {liveCaptionsEnabled && <LiveCaptionsHostAvailabilityToggle />}
                        </SideBarSection>
                    )}

                    <SideBarSection title={c('Title').t`Video and audio`}>
                        <SettingToggle
                            id="disable-videos"
                            label={c('Action').t`Incoming video`}
                            ariaLabel={c('Alt').t`Incoming video`}
                            onChange={() => dispatch(setDisableVideos(!disableVideos))}
                            checked={!disableVideos}
                        />
                        <SettingToggle
                            id="self-view"
                            label={c('Action').t`Self view`}
                            ariaLabel={c('Alt').t`Self view`}
                            onChange={() => dispatch(setSelfView(!selfView))}
                            checked={selfView}
                        />
                        <SettingToggle
                            id="pip-enabled"
                            label={c('Action').t`Picture-in-picture while sharing`}
                            ariaLabel={c('Alt').t`Picture-in-picture while sharing`}
                            onChange={() => dispatch(setPipEnabled(!pipEnabled))}
                            checked={pipEnabled}
                            disabled={isLocalScreenShare}
                            tooltip={
                                isLocalScreenShare
                                    ? c('Tooltip').t`Stop sharing your screen to change this setting`
                                    : undefined
                            }
                        />
                        <NoiseCancellingToggle
                            idBase="settings"
                            noiseFilter={noiseFilter}
                            toggleNoiseFilter={toggleNoiseFilter}
                        />
                    </SideBarSection>

                    <SideBarSection title={c('Title').t`Background`}>
                        <BackgroundBlurToggle
                            backgroundBlur={backgroundBlur}
                            loadingBackgroundBlur={loadingBackgroundBlur}
                            isBackgroundBlurSupported={isBackgroundBlurSupported}
                            onChange={() => {
                                void withLoadingBackgroundBlur(toggleBackgroundBlur());
                            }}
                            withTooltip={true}
                        />
                        {isVirtualBackgroundEnabled && (
                            <ConditionalTooltip
                                title={
                                    isBackgroundBlurSupported
                                        ? undefined
                                        : c('Tooltip').t`Background effects are not supported on your browser`
                                }
                            >
                                <span className="inline-block w-full">
                                    <Button
                                        shape="ghost"
                                        className="virtual-backgrounds-button w-full flex items-center justify-space-between flex-nowrap gap-2 px-0 py-0 text-left"
                                        disabled={!isBackgroundBlurSupported}
                                        onClick={() => dispatch(toggleSideBarStateAction(MeetingSideBars.Backgrounds))}
                                    >
                                        <span className="meet-font-weight">{c('Action').t`Virtual backgrounds`}</span>
                                        <IcChevronRight
                                            size={4}
                                            className="shrink-0 mr-custom"
                                            style={{ '--mr-custom': 'calc(var(--space-1) * -1)' }}
                                        />
                                    </Button>
                                </span>
                            </ConditionalTooltip>
                        )}
                    </SideBarSection>

                    <div ref={displayRef} className="shrink-0">
                        <SideBarSection title={c('Title').t`Display`}>
                            {liveCaptionsEnabled && (
                                <>
                                    <LiveCaptionsToggle />
                                    {wantsCaptions && canPickCaptionLanguage && <CaptionLanguageSelect />}
                                </>
                            )}
                            <SettingToggle
                                id="show-duration"
                                label={c('Action').t`Meeting timer`}
                                ariaLabel={c('Alt').t`Meeting timer`}
                                onChange={() => dispatch(toggleShowDuration())}
                                checked={showDuration}
                            />
                        </SideBarSection>
                    </div>
                </div>
            </div>
        </SideBar>
    );
};
