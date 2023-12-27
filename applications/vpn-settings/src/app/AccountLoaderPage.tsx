import { c } from 'ttag';

import { TextLoader } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import protonSpinner from '@proton/styles/assets/img/loading-spinners/proton-spinner.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    text?: string;
    loaderClassName?: string;
}

const AccountLoaderPage = ({ text, loaderClassName = '' }: Props) => {
    const appName = getAppName(APPS.PROTONVPN_SETTINGS);
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    return (
        <div className="h-full">
            <div className={clsx(['absolute inset-center text-center'])}>
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
