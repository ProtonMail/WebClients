import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { Button } from '@proton/atoms/Button/Button';
import { useMyCountry, useSecurityCheckup } from '@proton/components';
import RecoveryPhone from '@proton/components/containers/recovery/phone/RecoveryPhone';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import AccountLoaderPage from '../../../../content/AccountLoaderPage';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { phoneIcon } from '../../methodIcons';

const SetPhoneContainer = () => {
    const history = useHistory();

    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;

    const accountRecovery = useUpdateAccountRecovery();
    const defaultCountry = useMyCountry();

    if (accountRecovery.data.loading) {
        return <AccountLoaderPage />;
    }

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="danger" />}>
                {c('Safety review').t`Add a recovery phone number`}
            </SecurityCheckupMainTitle>

            <div className="mb-4">
                {c('Safety review')
                    .t`You can use your recovery phone to regain access to your account if you forget your password.`}
            </div>

            {accountRecovery.el}
            <RecoveryPhone
                autoFocus
                defaultCountry={defaultCountry}
                disableVerifyCta
                inputProps={{ label: c('Safety review').t`Recovery phone number` }}
                renderForm={({ onSubmit, input, submitButtonProps }) => {
                    return (
                        <form onSubmit={onSubmit}>
                            <div>{input}</div>

                            <Button className="mt-4" fullWidth color="norm" {...submitButtonProps}>
                                {c('Action').t`Add phone number`}
                            </Button>
                        </form>
                    );
                }}
                {...accountRecovery.recoveryPhone.props}
                onSubmit={async (value) => {
                    await accountRecovery.recoveryPhone.handleChangePhoneValue({ value, persistPasswordScope: true });

                    if (phone.verified) {
                        history.push(SECURITY_CHECKUP_PATHS.ROOT);
                        return;
                    }

                    history.push(`${SECURITY_CHECKUP_PATHS.VERIFY_PHONE}?setup=1`);
                }}
            />
        </SecurityCheckupMain>
    );
};

export default SetPhoneContainer;
