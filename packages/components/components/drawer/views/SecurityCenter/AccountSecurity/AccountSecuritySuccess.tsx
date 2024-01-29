import { c } from 'ttag';

import { isDarkTheme } from '@proton/shared/lib/themes/helpers';
import imgSuccessDarkTheme from '@proton/styles/assets/img/illustrations/account-security-success-dark.svg';
import imgSuccessWhiteTheme from '@proton/styles/assets/img/illustrations/account-security-success-white.svg';

const AccountSecuritySuccess = () => {
    const userHasDarkTheme = isDarkTheme();

    return (
        <div className="text-center pt-2">
            <img src={userHasDarkTheme ? imgSuccessDarkTheme : imgSuccessWhiteTheme} alt="" />
            <p className="mt-2 mb-1">{c('Title').t`Your account is protected`}</p>
            <p className="m-0 text-sm color-weak">{c('Description')
                .t`Your account and data recovery methods are set and 2FA is enabled.`}</p>
        </div>
    );
};

export default AccountSecuritySuccess;
