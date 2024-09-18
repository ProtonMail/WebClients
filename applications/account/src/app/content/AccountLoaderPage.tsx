import { c } from 'ttag';

import { TextLoader } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import protonSpinnerNegative from '@proton/styles/assets/img/loading-spinners/proton-spinner-negative.svg';
import protonSpinnerPositive from '@proton/styles/assets/img/loading-spinners/proton-spinner.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    text?: string;
    loaderClassName?: string;
    className?: string;
    isDarkBg?: boolean;
}

const AccountLoaderPage = ({ text, loaderClassName = '', className, isDarkBg = false }: Props) => {
    const appName = getAppName(APPS.PROTONACCOUNT);
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    return (
        <div className={clsx('h-full', className)}>
            <div className={clsx(['absolute inset-center text-center'])}>
                <div>
                    <img
                        className={clsx(['w-custom', loaderClassName])}
                        style={{ '--w-custom': '10em' }}
                        src={isDarkBg ? protonSpinnerNegative : protonSpinnerPositive}
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
