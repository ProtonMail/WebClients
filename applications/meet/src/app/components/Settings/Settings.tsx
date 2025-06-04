import { c } from 'ttag';

import { Label, Toggle } from '@proton/components';
import { Option, SelectTwo } from '@proton/components';
import noop from '@proton/utils/noop';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { videoQualities } from '../../constants';
import { useMeetContext } from '../../contexts/MeetContext';
import { useLocalParticipantResolution } from '../../hooks/useLocalParticipantResolution';
import { MeetingSideBars } from '../../types';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export const Settings = () => {
    const { sideBarState, selfView, setSelfView, shouldShowConnectionIndicator, setShouldShowConnectionIndicator } =
        useMeetContext();

    const { resolution, handleResolutionChange } = useLocalParticipantResolution();

    if (!sideBarState[MeetingSideBars.Settings]) {
        return null;
    }

    return (
        <SideBar>
            <div className="mb-4 h3">{c('Meet').t`Settings`}</div>

            {increasedVideoQuality && (
                <>
                    <Label>{c('Meet').t`Quality`}</Label>
                    <SelectTwo value={resolution} onValue={(value) => handleResolutionChange(value || '')}>
                        {videoQualities.map((q) => (
                            <Option
                                key={`${q.value.width}x${q.value.height}`}
                                value={`${q.value.width}x${q.value.height}`}
                                title={q.label}
                            />
                        ))}
                    </SelectTwo>
                </>
            )}
            <div className="flex flex-column w-full gap-6 pr-4">
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('Meet').t`Dark Mode`}</span>
                    <Toggle
                        id="dark-mode"
                        checked={true}
                        onChange={noop}
                        onClick={() => window.alert(c('Meet').t`Light mode is not supported yet`)}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('Meet').t`Hide self view`}</span>
                    <Toggle
                        id="hide-self-view"
                        checked={!selfView}
                        onChange={() => {
                            setSelfView(!selfView);
                        }}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('Meet').t`Show meeting timer`}</span>
                    <Toggle
                        id="meeting-timer"
                        checked={false}
                        onChange={noop}
                        onClick={() => window.alert(c('Meet').t`Meeting timer is not supported yet`)}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('Meet').t`Show connection indicator`}</span>
                    <Toggle
                        id="show-connection-indicator"
                        checked={shouldShowConnectionIndicator}
                        onChange={() => setShouldShowConnectionIndicator(!shouldShowConnectionIndicator)}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('Meet').t`Desktop notifications`}</span>
                    <Toggle
                        id="desktop-notifications"
                        checked={false}
                        onChange={noop}
                        onClick={() => window.alert(c('Meet').t`Desktop notifications are not supported yet`)}
                    />
                </div>
            </div>
        </SideBar>
    );
};
