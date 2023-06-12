import { MouseEventHandler, useState } from 'react';

import { c } from 'ttag';

import { SpotlightProps } from '@proton/components/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import devicesSpotlightIcon from '@proton/styles/assets/img/drive/computers-spotlight.png';

export const useDriveMyDevicesSpotlight = (): [SpotlightProps, (show: boolean) => void] => {
    const [show, setShow] = useState<boolean>(true);

    const stopPropagationOnClose: MouseEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const content = (
        <div className="flex flex-nowrap flex-align-items-center my-2">
            <div className="flex-item-noshrink mr-4">
                <img src={devicesSpotlightIcon} className="w4e" alt="" />
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
            originalPlacement: 'right',
            size: 'large',
            onClose: stopPropagationOnClose,
        },
        setShow,
    ];
};
