import React from 'react';
import { c } from 'ttag';

import { LargeButton } from 'react-components';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import noContentSvgLight from 'design-system/assets/img/pd-images/folder.svg';
import noContentSvgDark from 'design-system/assets/img/pd-images/folder-dark.svg';

interface Props {
    onCreate: () => void;
}

const HasNoFolders = ({ onCreate }: Props) => {
    const title = c('Title').t`You have no folders yet`;
    return (
        <div className="p1 flex flex-column flex-items-center w100">
            <img src={getLightOrDark(noContentSvgLight, noContentSvgDark)} alt={title} className="p1 mb1 w50" />
            <h2 className="bold">{title}</h2>
            <p className="m0">{c('Info').t`Create your first folder and start moving your files.`}</p>
            <div className="mt2 flex flex-column w200p">
                <LargeButton className="pm-button--primary ml1 mr1 mt0-25 strong" onClick={onCreate}>
                    {c('Action').t`Create`}
                </LargeButton>
            </div>
        </div>
    );
};

export default HasNoFolders;
