import { c } from 'ttag';

import { TextLoader } from '@proton/components';
import ElectronDraggeableHeaderWrapper from '@proton/components/components/electron/ElectronDraggeableHeaderWrapper';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import protonSpinner from '@proton/styles/assets/img/loading-spinners/proton-spinner.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    text?: string;
    loaderClassName?: string;
}

const AccountLoaderPage = ({ text, loaderClassName = '' }: Props) => {
    const appName = getAppName(APPS.PROTONACCOUNT);
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    return (
        <div className="h-full">
            <ElectronDraggeableHeaderWrapper />
            <div className={clsx(['absolute-center text-center'])}>
                <div>
                    <img
                        className={clsx(['w-custom', loaderClassName])}
                        style={{ '--w-custom': '10em' }}
                        src={protonSpinner}
                        aria-hidden="true"
                        alt=""
                    />
                </div>
                <TextLoader className="color-weak">{textToDisplay}</TextLoader>
            </div>
        </div>
    );
};

export default AccountLoaderPage;
