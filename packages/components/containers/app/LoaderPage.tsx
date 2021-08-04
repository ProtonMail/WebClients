import { c } from 'ttag';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { useConfig, useDocumentTitle } from '../../hooks';
import { FullLoader, ProminentContainer, TextLoader } from '../../components';

interface Props {
    text?: string;
    loaderClassName?: string;
}

const LoaderPage = ({ text, loaderClassName = '' }: Props) => {
    const { APP_NAME } = useConfig();

    const appName = APPS_CONFIGURATION[APP_NAME].name;
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    useDocumentTitle(appName);

    return (
        <ProminentContainer>
            <div className="centered-absolute text-center">
                <FullLoader className={loaderClassName} size={200} />
                <TextLoader>{textToDisplay}</TextLoader>
            </div>
        </ProminentContainer>
    );
};

export default LoaderPage;
