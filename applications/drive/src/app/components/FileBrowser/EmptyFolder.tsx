import React from 'react';
import { c } from 'ttag';

import { IllustrationPlaceholder } from 'react-components';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import noContentSvgLight from 'design-system/assets/img/pd-images/no-content.svg';
import noContentSvgDark from 'design-system/assets/img/pd-images/no-content-dark.svg';
import UploadButton from '../uploads/UploadButton';

const EmptyFolder = () => (
    <div className="p2 mt2 flex w100 flex flex-item-fluid">
        <IllustrationPlaceholder
            url={getLightOrDark(noContentSvgLight, noContentSvgDark)}
            title={c('Info').t`There are no files yet`}
        >
            <p className="m0">{c('Info').t`Drag and drop a file here or choose to upload.`}</p>
            <div className="mt2 flex flex-column flex-nowrap w200p">
                <UploadButton />
            </div>
        </IllustrationPlaceholder>
    </div>
);

export default EmptyFolder;
