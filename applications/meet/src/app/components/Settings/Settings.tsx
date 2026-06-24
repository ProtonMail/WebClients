import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
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

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { BackgroundBlurToggle } from './BackgroundBlurToggle';
import { NoiseCancellingToggle } from './NoiseCancellingToggle';
import { WaitingRoomToggle } from './WaitingRoomToggle';
import { SettingsArea } from './shared/SettingsArea';
import { SettingsToggle } from './shared/SettingsToggle';

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

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

    const [loadingLock, withLoadingLock] = useLoading();
    const [loadingBackgroundBlur, withLoadingBackgroundBlur] = useLoading();

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarStateAction(MeetingSideBars.Settings))}
            header={
                <div className="flex items-center">
                    <h2 className="text-3xl text-semibold">{c('Title').t`Settings`}</h2>
                </div>
            }
        >
            <div className="overflow-y-auto flex-1 min-h-0">
                <div className="flex flex-column flex-nowrap w-full gap-4 pr-4">
                    {(isLocalParticipantAdmin || isLocalParticipantHost) && (
                        <SettingsArea title={c('Title').t`Security`}>
                            <WaitingRoomToggle />
                            <SettingsToggle
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
                        <SettingsToggle
                            id="disable-videos"
                            label={c('Action').t`Turn off incoming video`}
                            ariaLabel={c('Alt').t`Turn off incoming video`}
                            onChange={() => dispatch(setDisableVideos(!disableVideos))}
                            checked={disableVideos}
                        />
                        <SettingsToggle
                            id="self-view"
                            label={c('Action').t`Hide self view`}
                            ariaLabel={c('Alt').t`Hide self view`}
                            onChange={() => dispatch(setSelfView(!selfView))}
                            checked={!selfView}
                        />
                        <SettingsToggle
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
                            <SettingsToggle
                                id="show-duration"
                                label={c('Action').t`Show duration`}
                                ariaLabel={c('Alt').t`Show duration`}
                                onChange={() => dispatch(toggleShowDuration())}
                                checked={showDuration}
                            />
                        </SettingsArea>
                    )}
                </div>
            </div>
        </SideBar>
    );
};
