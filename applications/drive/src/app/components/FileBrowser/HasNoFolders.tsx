import React from 'react';
import { c } from 'ttag';

import { Button } from '@proton/components';

import noContentSvg from '@proton/styles/assets/img/placeholders/empty-folder.svg';

interface Props {
    onCreate: () => void;
}

const HasNoFolders = ({ onCreate }: Props) => {
    const title = c('Title').t`You have no folders yet`;
    return (
        <div className="p1 flex flex-column flex-align-items-center w100">
            <img src={noContentSvg} alt={title} className="p1 mb1 w50" />
            <h2 className="text-bold">{title}</h2>
            <p className="m0">{c('Info').t`Create your first folder and start moving your files.`}</p>
            <div className="mt2 mb2 flex flex-column w13e">
                <Button size="large" color="norm" className="ml1 mr1 mt0-25 text-strong" onClick={onCreate}>
                    {c('Action').t`Create`}
                </Button>
            </div>
        </div>
    );
};

export default HasNoFolders;
