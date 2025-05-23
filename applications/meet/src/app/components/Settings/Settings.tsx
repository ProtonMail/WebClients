import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Label } from '@proton/components';
import { Option, SelectTwo } from '@proton/components';
import { IcCross } from '@proton/icons';

import { SideBar } from '../../atoms/SideBar';
import { videoQualities } from '../../constants';
import { useMeetContext } from '../../contexts/MeetContext';
import { useLocalParticipantResolution } from '../../hooks/useLocalParticipantResolution';

export const Settings = () => {
    const { isSettingsOpen, setIsSettingsOpen } = useMeetContext();

    const { resolution, handleResolutionChange } = useLocalParticipantResolution();

    if (!isSettingsOpen) {
        return null;
    }

    return (
        <SideBar>
            <div className="flex justify-end w-full">
                <Button shape="ghost" onClick={() => setIsSettingsOpen(false)}>
                    <IcCross size={6} />
                </Button>
            </div>
            <div className="mb-4 h3">{c('Meet').t`Settings`}</div>

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
        </SideBar>
    );
};
