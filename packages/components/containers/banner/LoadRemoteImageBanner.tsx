import { ReactNode } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';

interface Props {
    onClick: () => void;
    couldLoadDirect?: boolean;
    text: string;
    tooltip: ReactNode;
    actionText: string;
}
const LoadRemoteImageBanner = ({ onClick, couldLoadDirect, text, tooltip, actionText }: Props) => {
    return (
        <div className="bg-norm rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap flex-column md:flex-row">
            <div className="w-full flex flex-nowrap mb-2 md:mb-0">
                <Icon name={couldLoadDirect ? 'info-circle' : 'image'} className="mt-2 ml-1 flex-item-noshrink" />
                <span className="px-2 flex flex-item-fluid flex-align-items-center">{text}</span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex w-full md:w-auto pt-0.5">
                <Tooltip title={tooltip}>
                    <Button
                        onClick={onClick}
                        size="small"
                        color="weak"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        data-testid="remote-content:load"
                    >
                        {actionText}
                    </Button>
                </Tooltip>
            </span>
        </div>
    );
};

export default LoadRemoteImageBanner;
