import React from 'react';
import { c } from 'ttag';
import FullLoader from '../../components/loader/FullLoader';
import TextLoader from '../../components/loader/TextLoader';

const PreviewLoader = () => {
    return (
        <div className="file-preview-container">
            <div className="centered-absolute text-center w100">
                <FullLoader size={100} />
                <TextLoader>{c('Info').t`Loading preview`}</TextLoader>
            </div>
        </div>
    );
};

export default PreviewLoader;
