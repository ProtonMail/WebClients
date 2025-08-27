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
            className="screen-share-heading flex flex-nowrap items-center w-full h-custom rounded-lg px-4 py-0 justify-space-between"
            style={{ '--h-custom': '2.625rem' }}
        >
            <div className="flex flex-nowrap items-center gap-2">
                <SecurityShield
                    title={c('meet_2025 Info').t`End-to-end encryption is active for screen share`}
                    size={4}
                    tooltipPlacement="bottom-start"
                />
                <div>
                    {name} {isLocalUser ? c('meet_2025 Info').t`(You)` : ''} {c('meet_2025 Info').t`is presenting`}
                </div>
            </div>
            {isLocalUser && (
                <div>
                    <Button onClick={onStopScreenShare} color="norm" shape="ghost">
                        {c('meet_2025 Action').t`Stop presenting`}
                    </Button>
                </div>
            )}
        </div>
    );
};
