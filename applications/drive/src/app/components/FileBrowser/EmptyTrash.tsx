import React from 'react';
import noContentSvg from './no-trash.svg';
import { c } from 'ttag';
import { IllustrationPlaceholder } from 'react-components';

const EmptyTrash = () => (
    <div className="p2 mt2 flex w100">
        <IllustrationPlaceholder url={noContentSvg} title={c('Info').t`No files or folders in Trash`} />
    </div>
);

export default EmptyTrash;
