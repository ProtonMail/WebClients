import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useSecurityCheckup, useUserSettings } from '@proton/components';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import AccountLoaderPage from '../../../../content/AccountLoaderPage';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { emailIcon } from '../../methodIcons';

const SetEmailContainer = () => {
    const history = useHistory();

    const { securityState } = useSecurityCheckup();
    const { email } = securityState;

    const [userSettings, loadingUserSettings] = useUserSettings();

    if (loadingUserSettings) {
        return <AccountLoaderPage />;
    }

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="danger" />}>
                {c('Safety review').t`Add a recovery email`}
            </SecurityCheckupMainTitle>

            <div className="mb-4">
                {c('Safety review')
                    .t`You can use your recovery email to regain access to your account if you forget your password.`}
            </div>

            <RecoveryEmail
                autoFocus
                persistPasswordScope
                email={userSettings.Email}
                hasReset={!!userSettings.Email.Reset}
                hasNotify={!!userSettings.Email.Notify}
                disableVerifyCta
                inputProps={{ label: c('Safety review').t`Recovery email address` }}
                renderForm={({ onSubmit, input, submitButtonProps }) => {
                    return (
                        <form onSubmit={onSubmit}>
                            <div>{input}</div>

                            <Button className="mt-4" fullWidth color="norm" {...submitButtonProps}>
                                {c('Action').t`Add email address`}
                            </Button>
                        </form>
                    );
                }}
                onSuccess={() => {
                    if (email.verified) {
                        history.push(SECURITY_CHECKUP_PATHS.ROOT);
                        return;
                    }

                    history.push(`${SECURITY_CHECKUP_PATHS.VERIFY_EMAIL}?setup=1`);
                }}
            />
        </SecurityCheckupMain>
    );
};

export default SetEmailContainer;
