import type { ReactNode } from 'react';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcFileImage } from '@proton/icons/icons/IcFileImage';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

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
            icon={couldLoadDirect ? <IcInfoCircle /> : <IcFileImage />}
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
