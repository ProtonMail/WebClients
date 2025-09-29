import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLocalParticipantHost } from '../../hooks/useIsLocalParticipantHost';
import { MeetingSideBars } from '../../types';

import './Settings.scss';

export const Settings = () => {
    const {
        disableVideos,
        setDisableVideos,
        backgroundBlur,
        toggleBackgroundBlur,
        isVideoEnabled,
        videoDeviceId,
        noiseFilter,
        toggleNoiseFilter,
        isAudioEnabled,
        audioDeviceId,
        handleMeetingLockToggle,
        isMeetingLocked,
    } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const isLocalParticipantHost = useIsLocalParticipantHost();

    const [loadingLock, withLoadingLock] = useLoading();

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.Settings)}
            header={
                <div className="text-semibold flex items-center">
                    <div className="text-2xl">{c('Title').t`Settings`}</div>
                </div>
            }
        >
            <div className="flex flex-column w-full gap-4 pr-4">
                {isLocalParticipantHost && (
                    <div className="flex flex-column w-full gap-4">
                        <div className="text-semibold color-weak pb-2">Host</div>
                        <div className="flex flex-column w-full gap-4 pl-4">
                            <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
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
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        withLoadingLock(handleMeetingLockToggle(event.target.checked));
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
                    {isLocalParticipantHost && <div className="text-semibold color-weak py-2">Meeting</div>}
                    <div className={clsx('flex flex-column w-full gap-4', isLocalParticipantHost && 'pl-4')}>
                        <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx(
                                    'setting-label text-ellipsis',
                                    backgroundBlur ? 'color-norm' : 'color-hint'
                                )}
                                htmlFor="blur-background"
                            >{c('Action').t`Blur background`}</label>
                            <Toggle
                                id="blur-background"
                                checked={backgroundBlur}
                                onChange={() =>
                                    toggleBackgroundBlur({
                                        isEnabled: isVideoEnabled,
                                        videoDeviceId: videoDeviceId ?? '',
                                    })
                                }
                                className={clsx('settings-toggle', backgroundBlur ? '' : 'settings-toggle-inactive')}
                                aria-label={c('Alt').t`Blur background`}
                            />
                        </div>
                        <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx(
                                    'setting-label text-ellipsis',
                                    noiseFilter ? 'color-norm' : 'color-hint'
                                )}
                                htmlFor="noise-filter"
                            >{c('Action').t`Noise filter`}</label>
                            <Toggle
                                id="noise-filter"
                                checked={noiseFilter}
                                onChange={() =>
                                    toggleNoiseFilter({ isEnabled: isAudioEnabled, audioDeviceId: audioDeviceId ?? '' })
                                }
                                className={clsx('settings-toggle', noiseFilter ? '' : 'settings-toggle-inactive')}
                                aria-label={c('Alt').t`Noise filter`}
                            />
                        </div>
                        <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                            <label
                                className={clsx(
                                    'setting-label text-ellipsis',
                                    disableVideos ? 'color-norm' : 'color-hint'
                                )}
                                htmlFor="disable-videos"
                            >{c('Action').t`Stop incoming video`}</label>
                            <Toggle
                                id="disable-videos"
                                checked={disableVideos}
                                onChange={() => setDisableVideos(!disableVideos)}
                                className={clsx('settings-toggle', disableVideos ? '' : 'settings-toggle-inactive')}
                                aria-label={c('Alt').t`Stop incoming video`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SideBar>
    );
};
