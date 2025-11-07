import { c } from 'ttag';

import { ProtonLoader } from '@proton/atoms/ProtonLoader/ProtonLoader';
import { TextLoader } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
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
                    <ProtonLoader className={loaderClassName} />
                </div>
                <TextLoader className="color-weak">{textToDisplay}</TextLoader>
            </div>
        </div>
    );
};

export default AccountLoaderPage;
