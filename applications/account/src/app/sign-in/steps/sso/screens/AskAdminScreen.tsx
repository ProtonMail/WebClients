import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSOAdminDeviceConfirmation1 from '../components/SSOAdminDeviceConfirmation1';
import {
    selectBackupPasswordDisabled,
    selectHasSSOCapability,
    selectSSOData,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

export const AskAdminScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    const ssoData = SSOContext.useSelector(selectSSOData);
    const backupPasswordDisabled = SSOContext.useSelector(selectBackupPasswordDisabled);
    // Stays on screen while the administrator is asked, when the machine ignores it
    const canUseBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    return (
        <SignInStepLayout
            title={c('sso').t`Ask your administrator for access?`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <SSOAdminDeviceConfirmation1
                submitting={submitting}
                ssoData={ssoData}
                onConfirmAskAdmin={() => actorRef.send({ type: 'sso.adminHelp.confirmed' })}
                onUseBackupPassword={
                    canUseBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                }
                backupPasswordDisabled={backupPasswordDisabled}
            />
        </SignInStepLayout>
    );
};
