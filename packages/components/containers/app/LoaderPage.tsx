import { c } from 'ttag';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import protonSpinner from '@proton/styles/assets/img/loading-spinners/proton-spinner.svg';
import { useConfig, useDocumentTitle } from '../../hooks';
import { ProminentContainer, TextLoader } from '../../components';
import { classnames } from '../../helpers';


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
            <div className="absolute-center text-center">
                <div>
                    <img
                        className={classnames(['w10e', loaderClassName])}
                        src={protonSpinner}
                        alt={c('Info').t`Proton loading spinner`}
                    />
                </div>
                <TextLoader className="color-weak">{textToDisplay}</TextLoader>
            </div>
        </ProminentContainer>
    );
};

export default LoaderPage;
