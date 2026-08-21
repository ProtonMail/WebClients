import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
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
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { useLiveCaptionsFeatureEnabled } from '../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { BackgroundBlurToggle } from './BackgroundBlurToggle';
import { CaptionLanguageSelect } from './CaptionLanguageSelect';
import { LiveCaptionsToggle } from './LiveCaptionsToggle';
import { NoiseCancellingToggle } from './NoiseCancellingToggle';
import { WaitingRoomToggle } from './WaitingRoomToggle';
import { SettingsArea } from './shared/SettingsArea';

import './Settings.scss';

export const Settings = () => {
    const dispatch = useMeetDispatch();
    const { disableVideos, selfView, pipEnabled, meetingLocked: isMeetingLocked } = useMeetSelector(selectMeetSettings);

    const { backgroundBlur, toggleBackgroundBlur, isBackgroundBlurSupported, noiseFilter, toggleNoiseFilter } =
        useMediaManagementContext();
    const { handleMeetingLockToggle } = useMeetContext();
    const isLocalScreenShare = useMeetSelector(selectIsLocalScreenShare);

    const sideBarState = useMeetSelector(selectSideBarState);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);
    const showDuration = useMeetSelector(selectShowDuration);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const liveCaptionsEnabled = useLiveCaptionsFeatureEnabled();
    const { wantsCaptions } = useCaptionsPreference();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const [loadingLock, withLoadingLock] = useLoading();
    const [loadingBackgroundBlur, withLoadingBackgroundBlur] = useLoading();

    const accessibilityRef = useRef<HTMLDivElement>(null);
    const captionsWereOn = useRef(wantsCaptions);

    // The captions bar takes its height from the panel, which can push this section out of view.
    useEffect(() => {
        const justTurnedOn = wantsCaptions && !captionsWereOn.current;
        captionsWereOn.current = wantsCaptions;

        if (justTurnedOn) {
            accessibilityRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [wantsCaptions]);

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarStateAction(MeetingSideBars.Settings))}
            aria-label={c('Aria').t`Settings`}
            header={
                <div className="flex items-center">
                    <h2 className="text-3xl text-semibold">{c('Title').t`Settings`}</h2>
                </div>
            }
        >
            <div className="overflow-y-auto flex-1 min-h-0">
                <div className="flex flex-column flex-nowrap w-full gap-4 pr-4">
                    {isLocalParticipantAdminOrHost && (
                        <SettingsArea title={c('Title').t`Security`}>
                            <WaitingRoomToggle />
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
                        </SettingsArea>
                    )}
                    <SettingsArea title={c('Title').t`Video`}>
                        {!isMobile() && (
                            <BackgroundBlurToggle
                                backgroundBlur={backgroundBlur}
                                loadingBackgroundBlur={loadingBackgroundBlur}
                                isBackgroundBlurSupported={isBackgroundBlurSupported}
                                onChange={() => {
                                    void withLoadingBackgroundBlur(toggleBackgroundBlur());
                                }}
                                withTooltip={true}
                            />
                        )}
                        {isVirtualBackgroundEnabled && !isMobile() && (
                            <Button
                                shape="ghost"
                                className="virtual-backgrounds-button w-full flex items-center justify-space-between flex-nowrap gap-2 px-0 py-2 text-left"
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
                        )}
                        <SettingToggle
                            id="disable-videos"
                            label={c('Action').t`Turn off incoming video`}
                            ariaLabel={c('Alt').t`Turn off incoming video`}
                            onChange={() => dispatch(setDisableVideos(!disableVideos))}
                            checked={disableVideos}
                        />
                        <SettingToggle
                            id="self-view"
                            label={c('Action').t`Hide self view`}
                            ariaLabel={c('Alt').t`Hide self view`}
                            onChange={() => dispatch(setSelfView(!selfView))}
                            checked={!selfView}
                        />
                        <SettingToggle
                            id="pip-enabled"
                            label={c('Action').t`Show floating thumbnail during screensharing`}
                            ariaLabel={c('Alt').t`Show floating thumbnail during screensharing`}
                            onChange={() => dispatch(setPipEnabled(!pipEnabled))}
                            checked={pipEnabled}
                            disabled={isLocalScreenShare}
                        />
                    </SettingsArea>
                    <SettingsArea title={c('Title').t`Audio`}>
                        <div className="flex flex-column w-full gap-4 shrink-0">
                            <NoiseCancellingToggle
                                idBase="settings"
                                noiseFilter={noiseFilter}
                                toggleNoiseFilter={toggleNoiseFilter}
                            />
                        </div>
                    </SettingsArea>
                    {isPaidUser && (
                        <SettingsArea title={c('Title').t`Meeting settings`}>
                            <SettingToggle
                                id="show-duration"
                                label={c('Action').t`Show duration`}
                                ariaLabel={c('Alt').t`Show duration`}
                                onChange={() => dispatch(toggleShowDuration())}
                                checked={showDuration}
                            />
                        </SettingsArea>
                    )}
                    {liveCaptionsEnabled && (
                        <div ref={accessibilityRef} className="shrink-0">
                            <SettingsArea title={c('Title').t`Accessibility`}>
                                <LiveCaptionsToggle />
                                {wantsCaptions && <CaptionLanguageSelect />}
                            </SettingsArea>
                        </div>
                    )}
                </div>
            </div>
        </SideBar>
    );
};
