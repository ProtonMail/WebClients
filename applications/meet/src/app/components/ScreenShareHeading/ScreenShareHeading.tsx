import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';

import './ScreenShareHeading.scss';

interface ScreenShareHeadingProps {
    name: string;
    isLocalUser: boolean;
    onStopScreenShare: () => void;
}

export const ScreenShareHeading = ({ name, isLocalUser, onStopScreenShare }: ScreenShareHeadingProps) => {
    return (
        <div
            className="screen-share-heading flex flex-nowrap items-center w-full h-custom rounded-lg px-4 py-0 mb-4 justify-space-between rounded-full"
            style={{ '--h-custom': '2.625rem' }}
        >
            <div className="flex flex-nowrap items-center">
                <SecurityShield
                    title={c('Info').t`End-to-end encryption is active for screen share`}
                    size={3}
                    tooltipPlacement="bottom-start"
                />
                <div className="text-semibold text-sm">
                    {name} {isLocalUser ? c('Info').t`(you)` : ''} {c('Info').t`is presenting`}
                </div>
            </div>
            {isLocalUser && (
                <div>
                    <Button onClick={onStopScreenShare} color="norm" shape="ghost">
                        {c('Action').t`Stop presenting`}
                    </Button>
                </div>
            )}
        </div>
    );
};
