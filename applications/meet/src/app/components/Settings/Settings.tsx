import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetSettings, setDisableVideos, setPipEnabled, setSelfView } from '@proton/meet/store/slices/settings';
import {
    MeetingSideBars,
    selectSideBarState,
    toggleSideBarState as toggleSideBarStateAction,
} from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { BackgroundBlurToggle } from '../BackgroundBlurToggle';
import { NoiseCancellingToggle } from '../NoiseCancellingToggle';

import './Settings.scss';

export const Settings = () => {
    const dispatch = useMeetDispatch();
    const { disableVideos, selfView, pipEnabled, meetingLocked: isMeetingLocked } = useMeetSelector(selectMeetSettings);

    const { backgroundBlur, toggleBackgroundBlur, isBackgroundBlurSupported, noiseFilter, toggleNoiseFilter } =
        useMediaManagementContext();
    const { handleMeetingLockToggle, isLocalScreenShare } = useMeetContext();

    const sideBarState = useMeetSelector(selectSideBarState);

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
            <div className="flex flex-column w-full gap-4 pr-4">
                {(isLocalParticipantAdmin || isLocalParticipantHost) && (
                    <div className="flex flex-column w-full gap-4">
                        <h3 className="text-semibold text-rg color-weak pb-2">{c('Title').t`Security`}</h3>
                        <div className="flex flex-column w-full gap-4 pl-4">
                            <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
                                <label
                                    className={clsx(
                                        'setting-label text-ellipsis',
                                        isMeetingLocked ? 'color-norm' : 'color-hint'
                                    )}
                                    htmlFor="lock-meeting"
                                >{c('Action').t`Lock meeting`}</label>
                                <Toggle
                                    id="lock-meeting"
                                    checked={isMeetingLocked}
                                    onChange={() => {
                                        void withLoadingLock(handleMeetingLockToggle());
                                    }}
                                    className={clsx(
                                        'settings-toggle',
                                        isMeetingLocked ? '' : 'settings-toggle-inactive'
                                    )}
                                    aria-label={c('Alt').t`Lock meeting`}
                                    loading={loadingLock}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-column w-full gap-4">
                    <h3 className="text-semibold text-rg color-weak py-2">{c('Title').t`Video`}</h3>
                    <div className="flex flex-column w-full gap-4 pl-4">
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
                        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx(
                                    'setting-label text-ellipsis',
                                    disableVideos ? 'color-norm' : 'color-hint'
                                )}
                                htmlFor="disable-videos"
                            >{c('Action').t`Turn off incoming video`}</label>
                            <Toggle
                                id="disable-videos"
                                checked={disableVideos}
                                onChange={() => dispatch(setDisableVideos(!disableVideos))}
                                className={clsx('settings-toggle', disableVideos ? '' : 'settings-toggle-inactive')}
                            />
                        </div>
                        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx('setting-label text-ellipsis', !selfView ? 'color-norm' : 'color-hint')}
                                htmlFor="self-view"
                            >{c('Action').t`Hide self view`}</label>
                            <Toggle
                                id="self-view"
                                checked={!selfView}
                                onChange={() => dispatch(setSelfView(!selfView))}
                                className={clsx('settings-toggle', !selfView ? '' : 'settings-toggle-inactive')}
                            />
                        </div>
                        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx(
                                    'setting-label text-ellipsis',
                                    pipEnabled ? 'color-norm' : 'color-hint'
                                )}
                                htmlFor="pip-enabled"
                            >{c('Action').t`Picture-in-picture mode`}</label>
                            <Toggle
                                id="pip-enabled"
                                checked={pipEnabled}
                                onChange={() => dispatch(setPipEnabled(!pipEnabled))}
                                className={clsx('settings-toggle', pipEnabled ? '' : 'settings-toggle-inactive')}
                                disabled={isLocalScreenShare}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-column w-full gap-4">
                    <h3 className="text-semibold text-rg color-weak py-2">{c('Title').t`Audio`}</h3>
                    <div className="flex flex-column w-full gap-4 pl-4">
                        <NoiseCancellingToggle
                            idBase="settings"
                            noiseFilter={noiseFilter}
                            toggleNoiseFilter={toggleNoiseFilter}
                        />
                    </div>
                </div>
            </div>
        </SideBar>
    );
};
