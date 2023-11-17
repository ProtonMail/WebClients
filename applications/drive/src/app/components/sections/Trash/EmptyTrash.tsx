import { FC } from 'react';

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
                c('Info').t`No files or folders in trash`
            }
        />
    );
};

export default EmptyTrash;
