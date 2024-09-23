import { c } from 'ttag';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import imgSuccessDarkTheme from '@proton/styles/assets/img/illustrations/account-security-success-dark.svg';
import imgSuccessWhiteTheme from '@proton/styles/assets/img/illustrations/account-security-success-white.svg';

interface Props {
    twoFactorAuthSet: boolean;
}

const AccountSecuritySuccess = ({ twoFactorAuthSet }: Props) => {
    const theme = useTheme();
    const { dark } = theme.information;

    return (
        <div className="text-center pt-2">
            <img src={dark ? imgSuccessDarkTheme : imgSuccessWhiteTheme} alt="" />
            <p className="mt-2 mb-1">{c('Title').t`Your account is protected`}</p>
            <p className="m-0 text-sm color-weak">
                {twoFactorAuthSet
                    ? c('Description').t`Your account and data recovery methods are set and 2FA is enabled.`
                    : c('Description').t`Your account and data recovery methods are set.`}
            </p>
        </div>
    );
};

export default AccountSecuritySuccess;
