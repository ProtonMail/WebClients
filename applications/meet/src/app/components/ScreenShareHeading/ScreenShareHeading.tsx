import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcMeetScreenShare } from '@proton/icons';

import './ScreenShareHeading.scss';

interface ScreenShareHeadingProps {
    name: string;
    isLocalUser: boolean;
    onStopScreenShare: () => void;
}

export const ScreenShareHeading = ({ name, isLocalUser, onStopScreenShare }: ScreenShareHeadingProps) => {
    return (
        <div
            className="screen-share-heading flex flex-nowrap items-center w-full h-custom rounded-lg px-4 py-0 justify-space-between"
            style={{ '--h-custom': '3rem' }}
        >
            <div className="flex flex-nowrap items-center gap-2">
                <IcMeetScreenShare size={6} />
                {!isLocalUser && (
                    <div>
                        {name} {c('meet_2025 Info').t`is presenting`}
                    </div>
                )}
                {isLocalUser && <div>{c('meet_2025 Info').t`You are presenting`}</div>}
            </div>
            {isLocalUser && (
                <div>
                    <Button className="color-invert rounded-full" onClick={onStopScreenShare} color="norm">
                        {c('meet_2025 Action').t`Stop presenting`}
                    </Button>
                </div>
            )}
        </div>
    );
};
