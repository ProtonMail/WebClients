import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import SSOBackupPasswordForm from '../../../../components/password-forms/SSOBackupPasswordForm';
import Text from '../../../../public/Text';
import { SSOLoginCapabilites } from '../../../auth/interface';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import {
    selectBackupPasswordDisabled,
    selectBackupPasswordError,
    selectFirstLoginAfterConversion,
    selectHasSSOCapability,
    selectJoinOrganization,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

export const BackupPasswordScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    // Stays on screen while the password is checked, when the machine ignores it
    const offersAdminHelp = SSOContext.useSelector(selectHasSSOCapability(SSOLoginCapabilites.ASK_ADMIN));
    const isFirstLoginAfterConversion = SSOContext.useSelector(selectFirstLoginAfterConversion);
    const backupPasswordDisabled = SSOContext.useSelector(selectBackupPasswordDisabled);
    const error = SSOContext.useSelector(selectBackupPasswordError);
    const onChange = () => actorRef.send({ type: 'sso.backupPassword.edited' });
    // After converting to the organization's account, the first sign-in names the account it joins
    const joinedUsername = SSOContext.useSelector((snapshot) => selectJoinOrganization(snapshot).username);

    // A converted member finishes the conversion with their current password, which is never called a backup
    // password; only when the organization allows backup passwords are they told it becomes one
    if (isFirstLoginAfterConversion) {
        return (
            <>
                <layout.Header title={c('sso').t`Enter your password`} subTitle={joinedUsername} onBack={onBack} />
                <layout.Body>
                    <Text>
                        {c('sso').t`To make sure it's really you trying to sign-in, please enter your password.`}
                    </Text>
                    <SSOBackupPasswordForm
                        submitting={submitting}
                        error={error}
                        onChange={onChange}
                        passwordLabel={c('Label').t`Password`}
                        hint={
                            backupPasswordDisabled ? undefined : (
                                <p className="m-0 text-sm color-weak text-break">
                                    {getBoldFormattedText(
                                        c('sso')
                                            .t`Your old password will become your **backup password**. You will be able to use it to authorize single sign-on (SSO) on new devices in the future.`
                                    )}
                                </p>
                            )
                        }
                        onAskAdminHelp={
                            offersAdminHelp ? () => actorRef.send({ type: 'sso.adminHelp.requested' }) : undefined
                        }
                        onSubmit={(password) =>
                            actorRef.send({ type: 'sso.backupPassword.submitted', payload: { password } })
                        }
                    />
                </layout.Body>
            </>
        );
    }

    return (
        <>
            <layout.Header title={c('sso').t`Enter your backup password`} onBack={onBack} />
            <layout.Body>
                <Text>
                    {c('sso').t`To make sure it's really you trying to sign-in, please enter your backup password.`}
                </Text>
                <SSOBackupPasswordForm
                    submitting={submitting}
                    error={error}
                    onChange={onChange}
                    onAskAdminHelp={
                        offersAdminHelp ? () => actorRef.send({ type: 'sso.adminHelp.requested' }) : undefined
                    }
                    onSubmit={(password) =>
                        actorRef.send({ type: 'sso.backupPassword.submitted', payload: { password } })
                    }
                />
            </layout.Body>
        </>
    );
};
