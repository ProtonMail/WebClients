import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
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
                    <div className="text-2xl">{c('Title').t`Settings`}</div>
                </div>
            }
        >
            <div className="flex flex-column w-full gap-6 pr-4">
                <div className="flex items-center justify-space-between gap-2 setting-container w-full flex-nowrap">
                    <span className="setting-label color-weak text-ellipsis">{c('Action').t`Stop incoming video`}</span>
                    <Toggle
                        id="disable-videos"
                        checked={disableVideos}
                        onChange={() => setDisableVideos(!disableVideos)}
                        className={clsx('settings-toggle', disableVideos ? '' : 'settings-toggle-inactive')}
                        aria-label={c('Alt').t`Stop incoming video`}
                    />
                </div>
            </div>
        </SideBar>
    );
};
