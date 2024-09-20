import type { MouseEventHandler } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import type { SpotlightProps } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import devicesSpotlightIcon from '@proton/styles/assets/img/drive/computers-spotlight.png';

type DriveWindowsGASpotlightConfig = {
    placement?: SpotlightProps['originalPlacement'];
};

export const useDriveWindowsGASpotlight = (
    config: DriveWindowsGASpotlightConfig = {}
): [SpotlightProps, (show: boolean) => void] => {
    const [show, setShow] = useState<boolean>(true);

    const stopPropagationOnClose: MouseEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const content = (
        <div className="flex flex-nowrap items-center my-2">
            <div className="shrink-0 mr-4">
                <img src={devicesSpotlightIcon} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
            </div>
            <div>
                <p className="mt-0 mb-2 text-bold" data-testid="drive:my-devices:spotlight-title">
                    {c('Link').t`${DRIVE_APP_NAME} Windows app`}
                </p>
                <p className="m-0">{c('Link')
                    .t`Seamlessly sync files and folders between your computer and ${DRIVE_APP_NAME}.`}</p>
            </div>
        </div>
    );

    return [
        {
            show,
            content,
            originalPlacement: config.placement || 'right',
            size: 'large',
            onClose: stopPropagationOnClose,
        },
        setShow,
    ];
};
