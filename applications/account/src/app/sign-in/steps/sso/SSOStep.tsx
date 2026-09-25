import type { ComponentType } from 'react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';

import { SignInContext } from '../../wizard/SignInContext';
import { SSOContext } from './SSOContext';
import { AdminConfirmationCodeScreen } from './screens/AdminConfirmationCodeScreen';
import { AdminGrantedScreen } from './screens/AdminGrantedScreen';
import { AskAdminScreen } from './screens/AskAdminScreen';
import { BackupPasswordScreen } from './screens/BackupPasswordScreen';
import { FirstLoginAfterConversionScreen } from './screens/FirstLoginAfterConversionScreen';
import { NewBackupPasswordScreen } from './screens/NewBackupPasswordScreen';
import { OtherDevicesScreen } from './screens/OtherDevicesScreen';
import { RejectedScreen } from './screens/RejectedScreen';
import { SetupKeysScreen } from './screens/SetupKeysScreen';
import type { SSOScreen } from './state-machine/ssoStateMachine';

const screens: Record<SSOScreen, ComponentType> = {
    setupKeys: SetupKeysScreen,
    otherDevices: OtherDevicesScreen,
    askAdmin: AskAdminScreen,
    adminConfirmationCode: AdminConfirmationCodeScreen,
    backupPassword: BackupPasswordScreen,
    firstLoginAfterConversion: FirstLoginAfterConversionScreen,
    rejected: RejectedScreen,
    adminGranted: AdminGrantedScreen,
    newBackupPassword: NewBackupPasswordScreen,
};

const SSOScreens = () => {
    const screen = SSOContext.useSelector((snapshot) => snapshot.context.screen);
    if (!screen) {
        return null;
    }
    const Screen = screens[screen];
    return <Screen />;
};

/**
 * The SSO steps run as a child of the sign-in machine (`state-machine/ssoStateMachine`), which owns the requests,
 * polling and navigation; this picks the screen for its `screen`.
 */
export const SSOStep = () => {
    const ssoRef = SignInContext.useSelector((snapshot) => snapshot.children.sso);

    // Expected, and not seen in practice: back or a failure ends the SSO steps in the same transition that moves to the
    // credentials form, and a sign-in hands the session to the app first, which navigates away before a paint
    if (!ssoRef) {
        return <LoaderPage />;
    }

    return (
        <SSOContext.Provider value={ssoRef}>
            <SSOScreens />
        </SSOContext.Provider>
    );
};
