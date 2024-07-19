import type { FC } from 'react';

import { c } from 'ttag';

import emptySvg from '@proton/styles/assets/img/illustrations/empty-device-root.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';

type Props = {};

const EmptyDeviceRoot: FC<Props> = () => {
    return (
        <DriveEmptyView
            image={emptySvg}
            title={
                // translator: Shown when accessing an empty computer
                c('Info').t`No synced folders`
            }
            subtitle={
                // translator: Shown when accessing an empty computer
                c('Info').t`Folders you sync from your computer will appear here.`
            }
        />
    );
};

export default EmptyDeviceRoot;
