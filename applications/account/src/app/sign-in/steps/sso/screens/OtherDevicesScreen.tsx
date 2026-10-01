import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSODeviceConfirmation from '../components/SSODeviceConfirmation';
import { selectHasSSOCapability, selectSSOData, selectSubmitting } from '../state-machine/ssoStateMachine';

export const OtherDevicesScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const ssoData = SSOContext.useSelector(selectSSOData);
    // Once another device approves, the sign-in runs, until the app takes the page away
    const submitting = SSOContext.useSelector(selectSubmitting);
    // The SSO capabilities decide which ways out exist
    const offersBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    const offersAdminHelp = SSOContext.useSelector(selectHasSSOCapability(SSOLoginCapabilites.ASK_ADMIN));
    return (
        <>
            <layout.Header title={c('sso').t`Approve the sign-in from another device`} onBack={onBack} />
            <layout.Body>
                <SSODeviceConfirmation
                    signingIn={submitting}
                    ssoData={ssoData}
                    onAskAdminHelp={
                        offersAdminHelp ? () => actorRef.send({ type: 'sso.adminHelp.requested' }) : undefined
                    }
                    onUseBackupPassword={
                        offersBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                    }
                />
            </layout.Body>
        </>
    );
};
