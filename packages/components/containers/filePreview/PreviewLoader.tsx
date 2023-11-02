import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';

import { TextLoader } from '../../components';

const PreviewLoader = () => {
    return (
        <div className="file-preview-container">
            <div className="absolute-center text-center w-full">
                <CircleLoader size="large" />
                <TextLoader>{c('Info').t`Loading preview`}</TextLoader>
            </div>
        </div>
    );
};

export default PreviewLoader;
