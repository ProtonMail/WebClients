import React from 'react';
import { c } from 'ttag';

import { IllustrationPlaceholder } from 'react-components';

import noContentSvg from 'design-system/assets/img/placeholders/empty-trash.svg';

const EmptyTrash = () => (
    <div className="p2 mt2 flex w100 flex flex-item-fluid">
        <IllustrationPlaceholder url={noContentSvg} title={c('Info').t`No files or folders in trash`} />
    </div>
);

export default EmptyTrash;
