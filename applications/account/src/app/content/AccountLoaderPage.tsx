import { c } from 'ttag';

import { ProtonLoader, ProtonLoaderType } from '@proton/atoms';
import { TextLoader } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
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
                    <ProtonLoader className={loaderClassName} type={isDarkBg ? ProtonLoaderType.Negative : undefined} />
                </div>
                <TextLoader className="color-weak">{textToDisplay}</TextLoader>
            </div>
        </div>
    );
};

export default AccountLoaderPage;
