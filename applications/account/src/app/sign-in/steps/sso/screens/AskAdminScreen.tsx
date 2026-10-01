import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSOAdminDeviceConfirmation1 from '../components/SSOAdminDeviceConfirmation1';
import {
    selectBackupPasswordDisabled,
    selectHasSSOCapability,
    selectSSOData,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

export const AskAdminScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    const ssoData = SSOContext.useSelector(selectSSOData);
    const backupPasswordDisabled = SSOContext.useSelector(selectBackupPasswordDisabled);
    // Stays on screen while the administrator is asked, when the machine ignores it
    const canUseBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    return (
        <>
            <layout.Header title={c('sso').t`Ask your administrator for access?`} onBack={onBack} />
            <layout.Body>
                <SSOAdminDeviceConfirmation1
                    submitting={submitting}
                    ssoData={ssoData}
                    onConfirmAskAdmin={() => actorRef.send({ type: 'sso.adminHelp.confirmed' })}
                    onUseBackupPassword={
                        canUseBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                    }
                    backupPasswordDisabled={backupPasswordDisabled}
                />
            </layout.Body>
        </>
    );
};
