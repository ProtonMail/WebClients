import { c } from 'ttag';

import { SSOLoginCapabilites } from '../../../auth/interface';
import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSODeviceConfirmation from '../components/SSODeviceConfirmation';
import { selectHasSSOCapability, selectSSOData } from '../state-machine/ssoStateMachine';

export const OtherDevicesScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const ssoData = SSOContext.useSelector(selectSSOData);
    // The SSO capabilities decide which ways out exist. They stay on screen while the approved device is confirmed,
    // when the machine ignores them.
    const offersBackupPassword = SSOContext.useSelector(
        selectHasSSOCapability(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)
    );
    const offersAdminHelp = SSOContext.useSelector(selectHasSSOCapability(SSOLoginCapabilites.ASK_ADMIN));
    return (
        <SignInStepLayout
            title={c('sso').t`Approve the sign-in from another device`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <SSODeviceConfirmation
                ssoData={ssoData}
                onAskAdminHelp={offersAdminHelp ? () => actorRef.send({ type: 'sso.adminHelp.requested' }) : undefined}
                onUseBackupPassword={
                    offersBackupPassword ? () => actorRef.send({ type: 'sso.backupPassword.requested' }) : undefined
                }
            />
        </SignInStepLayout>
    );
};
