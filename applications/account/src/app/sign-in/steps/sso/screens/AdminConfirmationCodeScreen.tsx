import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSOAdminDeviceConfirmation2 from '../components/SSOAdminDeviceConfirmation2';
import { selectHasSSOCapability, selectSSOData } from '../state-machine/ssoStateMachine';

/** Waits for the administrator to approve; the machine polls in the meantime. */
export const AdminConfirmationCodeScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const ssoData = SSOContext.useSelector(selectSSOData);
    // Stays on screen while the approved device is confirmed, when the machine ignores it
    const offersBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    return (
        <SignInStepLayout
            title={c('sso').t`Share the confirmation code with your administrator`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <SSOAdminDeviceConfirmation2
                ssoData={ssoData}
                onUseBackupPassword={
                    offersBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                }
            />
        </SignInStepLayout>
    );
};
