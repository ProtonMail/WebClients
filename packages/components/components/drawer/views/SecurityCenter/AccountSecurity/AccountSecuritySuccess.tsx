import { c } from 'ttag';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { getPlaceholderSrc } from '@proton/mail/helpers/getPlaceholderSrc';
import imgSuccessDark from '@proton/styles/assets/img/placeholders/lock-cool-dark.svg';
import imgSuccessLight from '@proton/styles/assets/img/placeholders/lock-cool-light.svg';
import imgSuccessWarm from '@proton/styles/assets/img/placeholders/lock-warm-light.svg';

interface Props {
    twoFactorAuthSet: boolean;
}

const AccountSecuritySuccess = ({ twoFactorAuthSet }: Props) => {
    const theme = useTheme();
    return (
        <div className="text-center pt-2">
            <img
                height={128}
                className="w-auto"
                src={getPlaceholderSrc({
                    theme: theme.information.theme,
                    warmLight: imgSuccessWarm,
                    coolLight: imgSuccessLight,
                    coolDark: imgSuccessDark,
                })}
                alt=""
            />
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
