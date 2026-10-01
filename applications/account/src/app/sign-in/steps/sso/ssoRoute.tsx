import { signInRoute } from '../../routes/signInRoute';
import { SSOContext } from './SSOContext';
import { AccessGrantedScreen } from './screens/AccessGrantedScreen';
import { AdminConfirmationCodeScreen } from './screens/AdminConfirmationCodeScreen';
import { AdminGrantedScreen } from './screens/AdminGrantedScreen';
import { AskAdminScreen } from './screens/AskAdminScreen';
import { BackupPasswordScreen } from './screens/BackupPasswordScreen';
import { FirstLoginAfterConversionScreen } from './screens/FirstLoginAfterConversionScreen';
import { NewBackupPasswordScreen } from './screens/NewBackupPasswordScreen';
import { OtherDevicesScreen } from './screens/OtherDevicesScreen';
import { RejectedScreen } from './screens/RejectedScreen';
import { SetupKeysScreen } from './screens/SetupKeysScreen';
import { selectScreen } from './state-machine/ssoStateMachine';

/**
 * The SSO steps run as a child of the sign-in machine (`state-machine/ssoStateMachine`), which owns the requests,
 * polling and navigation; its `screen` picks the screen.
 */
export const ssoRoute = signInRoute({
    provider: SSOContext.Provider,
    screen: selectScreen,
    screens: {
        setupKeys: SetupKeysScreen,
        otherDevices: OtherDevicesScreen,
        askAdmin: AskAdminScreen,
        adminConfirmationCode: AdminConfirmationCodeScreen,
        backupPassword: BackupPasswordScreen,
        firstLoginAfterConversion: FirstLoginAfterConversionScreen,
        rejected: RejectedScreen,
        adminGranted: AdminGrantedScreen,
        newBackupPassword: NewBackupPasswordScreen,
        accessGranted: AccessGrantedScreen,
    },
});
