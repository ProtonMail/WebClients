import { c } from 'ttag';

import { Label, Toggle } from '@proton/components';
import { Option, SelectTwo } from '@proton/components';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { videoQualities } from '../../constants';
import { useMeetContext } from '../../contexts/MeetContext';
import { useLocalParticipantResolution } from '../../hooks/useLocalParticipantResolution';
import { MeetingSideBars } from '../../types';

import './Settings.scss';

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
            <div className="mb-4 h3 text-semibold">{c('l10n_nightly Title').t`Settings`}</div>

            {increasedVideoQuality && (
                <>
                    <Label>{c('l10n_nightly Label').t`Quality`}</Label>
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
                    <span className="text-xl text-neutral-weak">{c('l10n_nightly Action').t`Dark Mode`}</span>
                    <Toggle
                        id="dark-mode"
                        checked={true}
                        onChange={noop}
                        onClick={() => window.alert(c('l10n_nightly Alert').t`Light mode is not supported yet`)}
                        className="settings-toggle"
                        aria-label={c('l10n_nightly Alt').t`Toggle dark mode`}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('l10n_nightly Action').t`Hide self view`}</span>
                    <Toggle
                        id="hide-self-view"
                        checked={!selfView}
                        onChange={() => {
                            setSelfView(!selfView);
                        }}
                        className={clsx('settings-toggle', selfView ? 'settings-toggle-inactive' : '')}
                        aria-label={c('l10n_nightly Alt').t`Hide self view`}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('l10n_nightly Action').t`Show meeting timer`}</span>
                    <Toggle
                        id="meeting-timer"
                        checked={false}
                        onChange={noop}
                        onClick={() => window.alert(c('l10n_nightly Alert').t`Meeting timer is not supported yet`)}
                        className="settings-toggle settings-toggle-inactive"
                        aria-label={c('l10n_nightly Alt').t`Show meeting timer`}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('l10n_nightly Action')
                        .t`Show connection indicator`}</span>
                    <Toggle
                        id="show-connection-indicator"
                        checked={shouldShowConnectionIndicator}
                        onChange={() => setShouldShowConnectionIndicator(!shouldShowConnectionIndicator)}
                        className={clsx(
                            'settings-toggle',
                            shouldShowConnectionIndicator ? '' : 'settings-toggle-inactive'
                        )}
                        aria-label={c('l10n_nightly Alt').t`Show connection indicator`}
                    />
                </div>
                <div className="flex items-center justify-space-between gap-2">
                    <span className="text-xl text-neutral-weak">{c('l10n_nightly Action')
                        .t`Desktop notifications`}</span>
                    <Toggle
                        id="desktop-notifications"
                        checked={false}
                        onChange={noop}
                        onClick={() =>
                            window.alert(c('l10n_nightly Alert').t`Desktop notifications are not supported yet`)
                        }
                        className="color-weak bg-weak settings-toggle settings-toggle-inactive"
                        aria-label={c('l10n_nightly Alt').t`Desktop notifications`}
                    />
                </div>
            </div>
        </SideBar>
    );
};
