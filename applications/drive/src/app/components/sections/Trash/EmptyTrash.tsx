import type { FC } from 'react';

import { c } from 'ttag';

import noContentSvg from '@proton/styles/assets/img/illustrations/empty-trash.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';

type Props = {};

const EmptyTrash: FC<Props> = () => {
    return (
        <DriveEmptyView
            image={noContentSvg}
            title={
                // translator: Shown on empty Trash page
                c('Info').t`Trash is empty`
            }
            subtitle={
                // translator: Shown on empty Trash page
                c('Info').t`Items moved to the trash will stay here until deleted`
            }
        />
    );
};

export default EmptyTrash;
