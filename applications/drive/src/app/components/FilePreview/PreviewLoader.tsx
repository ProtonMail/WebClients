import React from 'react';
import { c } from 'ttag';
import { FullLoader, TextLoader } from 'react-components';

const PreviewLoader = () => {
    return (
        <div className="pd-file-preview-container">
            <div className="centered-absolute">
                <FullLoader size={100} color="global-light" />
                <TextLoader>{c('Info').t`Loading preview`}</TextLoader>
            </div>
        </div>
    );
};

export default PreviewLoader;
