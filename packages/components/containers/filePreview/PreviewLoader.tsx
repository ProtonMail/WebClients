import { c } from 'ttag';
import { TextLoader, CircleLoader } from '../../components';

const PreviewLoader = () => {
    return (
        <div className="file-preview-container">
            <div className="absolute-center text-center w100">
                <CircleLoader size="large" />
                <TextLoader>{c('Info').t`Loading preview`}</TextLoader>
            </div>
        </div>
    );
};

export default PreviewLoader;
