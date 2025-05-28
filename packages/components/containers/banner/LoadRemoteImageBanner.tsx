import type { ReactNode } from 'react';

import { Banner, Button } from '@proton/atoms';
import { Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

interface Props {
    onClick: () => void;
    couldLoadDirect?: boolean;
    text: string;
    tooltip: ReactNode;
    actionText: string;
}
const LoadRemoteImageBanner = ({ onClick, couldLoadDirect, text, tooltip, actionText }: Props) => {
    return (
        <Banner
            icon={<Icon name={couldLoadDirect ? 'info-circle' : 'file-image'} />}
            variant="norm-outline"
            action={
                <Tooltip title={tooltip}>
                    <Button
                        onClick={onClick}
                        size="small"
                        color="weak"
                        shape="outline"
                        data-testid="remote-content:load"
                    >
                        {actionText}
                    </Button>
                </Tooltip>
            }
        >
            {text}
        </Banner>
    );
};

export default LoadRemoteImageBanner;
