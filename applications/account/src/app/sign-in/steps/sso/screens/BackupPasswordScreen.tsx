import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import SSOBackupPasswordForm from '../../../../components/password-forms/SSOBackupPasswordForm';
import Text from '../../../../public/Text';
import { SSOLoginCapabilites } from '../../../auth/interface';
import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import {
    selectFirstLoginAfterConversion,
    selectHasSSOCapability,
    selectJoinOrganization,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

export const BackupPasswordScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    // Stays on screen while the password is checked, when the machine ignores it
    const offersAdminHelp = SSOContext.useSelector(selectHasSSOCapability(SSOLoginCapabilites.ASK_ADMIN));
    const isFirstLoginAfterConversion = SSOContext.useSelector(selectFirstLoginAfterConversion);
    const joinUsername = SSOContext.useSelector((snapshot) => selectJoinOrganization(snapshot).username);
    return (
        <SignInStepLayout
            title={c('sso').t`Enter your backup password`}
            subTitle={isFirstLoginAfterConversion ? joinUsername : undefined}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            {isFirstLoginAfterConversion ? (
                <>
                    <Text margin="small">
                        {getBoldFormattedText(
                            c('sso')
                                .t`Because your organization moved you to single sign-on (SSO), **your old password is saved as your backup password**. You can use it to authorize SSO on a new device.`
                        )}
                    </Text>
                    <Text>{c('sso').t`Enter it to sign in. It is the same as your old password.`}</Text>
                </>
            ) : (
                <Text>
                    {c('sso').t`To make sure it's really you trying to sign-in, please enter your backup password.`}
                </Text>
            )}
            <SSOBackupPasswordForm
                submitting={submitting}
                onAskAdminHelp={offersAdminHelp ? () => actorRef.send({ type: 'sso.adminHelp.requested' }) : undefined}
                onSubmit={(password) => actorRef.send({ type: 'sso.backupPassword.submitted', payload: { password } })}
            />
        </SignInStepLayout>
    );
};
