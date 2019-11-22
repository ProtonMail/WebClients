import React from 'react';
import noContentSvg from './no-contents.svg';
import { c } from 'ttag';
import { IllustrationPlaceholder } from 'react-components';

const EmptyFolder = () => (
    <div className="p2 mt2 flex w100">
        <IllustrationPlaceholder url={noContentSvg} title={c('Info').t`There are no files yet`} />
    </div>
);

export default EmptyFolder;
