import { c } from 'ttag';

import { Toggle } from '@proton/components';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

import './Settings.scss';

export const Settings = () => {
    const { selfView, setSelfView, disableVideos, setDisableVideos } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.Settings)}
            header={
                <div className="text-semibold flex items-center">
                    <div className="text-2xl">{c('meet_2025 Title').t`Settings`}</div>
                </div>
            }
        >
            <div className="flex flex-column w-full gap-6 pr-4">
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('meet_2025 Action').t`Dark Mode`}</span>
                    <Toggle
                        id="dark-mode"
                        checked={true}
                        onChange={noop}
                        onClick={() => window.alert(c('meet_2025 Alert').t`Light mode is not supported yet`)}
                        className="settings-toggle"
                        aria-label={c('meet_2025 Alt').t`Toggle dark mode`}
                        disabled={true}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('meet_2025 Action')
                        .t`Hide self view`}</span>
                    <Toggle
                        id="hide-self-view"
                        checked={!selfView}
                        onChange={() => {
                            setSelfView(!selfView);
                        }}
                        className={clsx('settings-toggle', selfView ? 'settings-toggle-inactive' : '')}
                        aria-label={c('meet_2025 Alt').t`Hide self view`}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('meet_2025 Action')
                        .t`Show meeting timer`}</span>
                    <Toggle
                        id="meeting-timer"
                        checked={false}
                        onChange={noop}
                        onClick={() => window.alert(c('meet_2025 Alert').t`Meeting timer is not supported yet`)}
                        className="settings-toggle settings-toggle-inactive"
                        aria-label={c('meet_2025 Alt').t`Show meeting timer`}
                        disabled={true}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('meet_2025 Action')
                        .t`Desktop notifications`}</span>
                    <Toggle
                        id="desktop-notifications"
                        checked={false}
                        onChange={noop}
                        onClick={() =>
                            window.alert(c('meet_2025 Alert').t`Desktop notifications are not supported yet`)
                        }
                        className="settings-toggle settings-toggle-inactive"
                        aria-label={c('meet_2025 Alt').t`Desktop notifications`}
                        disabled={true}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('meet_2025 Action')
                        .t`Hide participant videos`}</span>
                    <Toggle
                        id="disable-videos"
                        checked={disableVideos}
                        onChange={() => setDisableVideos(!disableVideos)}
                        className={clsx('settings-toggle', disableVideos ? '' : 'settings-toggle-inactive')}
                        aria-label={c('meet_2025 Alt').t`Hide participant videos`}
                    />
                </div>
            </div>
        </SideBar>
    );
};
