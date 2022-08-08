import { c } from 'ttag';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import protonSpinner from '@proton/styles/assets/img/loading-spinners/proton-spinner.svg';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getIsAuthorizedApp, postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { useConfig, useDocumentTitle } from '../../hooks';
import { Button, CircleLoader, Icon, TextLoader, Tooltip } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    text?: string;
    loaderClassName?: string;
}

const LoaderPage = ({ text, loaderClassName = '' }: Props) => {
    const { APP_NAME } = useConfig();

    const isIframe = window.self !== window.top;
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isSideApp = isIframe && !!parentApp && getIsAuthorizedApp(parentApp);

    const appName = APPS_CONFIGURATION[APP_NAME].name;
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    useDocumentTitle(appName);

    const handleCloseIFrame = () => {
        if (!parentApp) {
            return;
        }
        postMessageFromIframe(
            {
                type: SIDE_APP_EVENTS.SIDE_APP_CLOSE,
            },
            parentApp
        );
    };

    return (
        <div className="h100">
            <div className={classnames(['absolute-center text-center', isSideApp && 'w90'])}>
                {isSideApp && <CircleLoader className="mauto color-primary" size="medium" />}
                {!isIframe && (
                    <div>
                        <img className={classnames(['w10e', loaderClassName])} src={protonSpinner} />
                    </div>
                )}
                <TextLoader className="color-weak">{textToDisplay}</TextLoader>
            </div>
            {isSideApp && (
                <div className="header pl1 flex flex-justify-end flex-align-items-center">
                    <Tooltip title={c('Action').t`Close`}>
                        <Button icon color="weak" shape="ghost" onClick={handleCloseIFrame}>
                            <Icon name="cross-big" size={16} />
                        </Button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default LoaderPage;
