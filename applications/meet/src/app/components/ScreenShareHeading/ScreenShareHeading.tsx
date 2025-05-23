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
            className="screen-share-heading flex flex-nowrap items-center w-full h-custom rounded-lg px-4 py-3 justify-space-between"
            style={{ '--h-custom': '3.875rem' }}
        >
            <div className="flex flex-nowrap items-center gap-2">
                <IcMeetScreenShare size={6} viewBox="0 0 24 24" />
                {!isLocalUser && (
                    <div>
                        {name} {c('Meet').t`is presenting`}
                    </div>
                )}
                {isLocalUser && <div>{c('Meet').t`You presenting`}</div>}
            </div>
            {isLocalUser && (
                <div>
                    <Button onClick={onStopScreenShare} color="norm">{c('Meet').t`Stop presenting`}</Button>
                </div>
            )}
        </div>
    );
};
