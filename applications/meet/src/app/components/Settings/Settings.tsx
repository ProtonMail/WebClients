import { c } from 'ttag';

import { Toggle } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';

import './Settings.scss';

export const Settings = () => {
    const { disableVideos, setDisableVideos } = useMeetContext();

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
