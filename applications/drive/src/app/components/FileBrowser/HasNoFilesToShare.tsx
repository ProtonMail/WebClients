import React from 'react';
import { c } from 'ttag';

import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import noContentSvgLight from 'design-system/assets/img/pd-images/folder.svg';
import noContentSvgDark from 'design-system/assets/img/pd-images/folder-dark.svg';

const HasNoFilesToShare = () => {
    const title = c('Title').t`You have no files to share`;

    return (
        <div className="p1 flex flex-column flex-items-center w100">
            <img src={getLightOrDark(noContentSvgLight, noContentSvgDark)} alt={title} className="p1 mb1 w50" />
            <h2 className="bold">{title}</h2>
            <p className="m0 pb3">{c('Info').t`Go to "My files" and upload some files first.`}</p>
        </div>
    );
};

export default HasNoFilesToShare;
