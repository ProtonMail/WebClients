import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSOAdminDeviceConfirmation2 from '../components/SSOAdminDeviceConfirmation2';
import { selectHasSSOCapability, selectSSOData, selectSubmitting } from '../state-machine/ssoStateMachine';

/** Waits for the administrator to approve; the machine polls in the meantime. */
export const AdminConfirmationCodeScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const ssoData = SSOContext.useSelector(selectSSOData);
    // Once the administrator approves, the sign-in runs, until the app takes the page away
    const submitting = SSOContext.useSelector(selectSubmitting);
    const offersBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    return (
        <>
            <layout.Header title={c('sso').t`Share the confirmation code with your administrator`} onBack={onBack} />
            <layout.Body>
                <SSOAdminDeviceConfirmation2
                    signingIn={submitting}
                    ssoData={ssoData}
                    onUseBackupPassword={
                        offersBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                    }
                />
            </layout.Body>
        </>
    );
};
