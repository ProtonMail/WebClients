import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { getSectionPath, getSubroutePath } from '@proton/components/containers/layout/helper';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { SettingsCardMaxWidth, SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { OverviewSectionV2 } from '@proton/components/containers/recovery/OverviewSectionV2';
import EmergencyContacts from '@proton/components/containers/recovery/navItems/EmergencyContacts';
import RecoveryContacts from '@proton/components/containers/recovery/navItems/RecoveryContacts';
import RecoveryDevice from '@proton/components/containers/recovery/navItems/RecoveryDevice';
import RecoveryEmail from '@proton/components/containers/recovery/navItems/RecoveryEmail';
import RecoveryFile from '@proton/components/containers/recovery/navItems/RecoveryFile';
import RecoveryPhone from '@proton/components/containers/recovery/navItems/RecoveryPhone';
import RecoveryPhrase from '@proton/components/containers/recovery/navItems/RecoveryPhrase';
import RecoveryQrCode from '@proton/components/containers/recovery/navItems/RecoveryQrCode';
import SignedInReset from '@proton/components/containers/recovery/navItems/SignedInReset';
import { RecoverySettingsTelemetryVariantProvider } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import {
    PrivateMainSettingsArea,
    PrivateMainSubSettingsArea,
    RecoveryPageTelemetry,
    SettingsNavGroup,
} from '@proton/components/index';
import { APPS } from '@proton/shared/lib/constants';

import DeviceBasedRecoverySubpage from '../../../../app/containers/account/recovery/recoverySubpages/DeviceBasedRecoverySubpage';
import { EmergencyContactSubpage } from '../../../../app/containers/account/recovery/recoverySubpages/EmergencyContactSubpage';
import { RecoveryContactSubpage } from '../../../../app/containers/account/recovery/recoverySubpages/RecoveryContactSubpage';
import RecoveryEmailSubpage from '../../../../app/containers/account/recovery/recoverySubpages/RecoveryEmailSubpage';
import RecoveryFileSubpage from '../../../../app/containers/account/recovery/recoverySubpages/RecoveryFileSubpage';
import RecoveryPhoneSubpage from '../../../../app/containers/account/recovery/recoverySubpages/RecoveryPhoneSubpage';
import RecoveryPhraseSubpage from '../../../../app/containers/account/recovery/recoverySubpages/RecoveryPhraseSubpage';
import { SessionRecoverySubpage } from '../../../../app/containers/account/recovery/recoverySubpages/SessionRecoverySubpage';
import SignInWithAnotherDeviceSubpage from '../../../../app/containers/account/recovery/recoverySubpages/SignInWithAnotherDeviceSubpage';
import { PasswordResetOptionRequiredWarningInGroup } from '../../../../app/containers/account/recovery/recoverySubpages/shared/PasswordResetOptionRequiredWarning';

import '../AccountSettings.scss';

interface Props {
    routeConfig: SectionConfig;
}

const RecoveryPage = ({ routeConfig }: Props) => {
    const recoverySubrouteGroups = routeConfig.subrouteGroups;
    if (!recoverySubrouteGroups) {
        throw new Error('Missing sub groups');
    }
    const { passwordReset, dataRecovery, advancedRecovery } = recoverySubrouteGroups;
    const recoveryPath = getSectionPath('', routeConfig);

    return (
        <RecoverySettingsTelemetryVariantProvider value={'B'}>
            <RecoveryPageTelemetry />
            <Switch>
                <Route path={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={passwordReset.subroutes.email.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={passwordReset.subroutes.email.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <RecoveryEmailSubpage />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, passwordReset.subroutes.phone)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={passwordReset.subroutes.phone.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={passwordReset.subroutes.phone.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <RecoveryPhoneSubpage />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, dataRecovery.subroutes.deviceRecovery)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={dataRecovery.subroutes.deviceRecovery.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={dataRecovery.subroutes.deviceRecovery.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <DeviceBasedRecoverySubpage
                            emailSubpagePath={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}
                        />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, dataRecovery.subroutes.backupFile)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={dataRecovery.subroutes.backupFile.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={dataRecovery.subroutes.backupFile.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <RecoveryFileSubpage
                            emailSubpagePath={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}
                        />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.phrase)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={c('Title').t`Recovery phrase`}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={advancedRecovery.subroutes.phrase.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <RecoveryPhraseSubpage />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, dataRecovery.subroutes.recoveryContacts)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={dataRecovery.subroutes.recoveryContacts.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={dataRecovery.subroutes.recoveryContacts.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <RecoveryContactSubpage
                            app={APPS.PROTONACCOUNTLITE}
                            emailSubpagePath={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}
                        />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.emergencyContacts)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={advancedRecovery.subroutes.emergencyContacts.text}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={advancedRecovery.subroutes.emergencyContacts.variant}
                        maxWidth={SettingsCardMaxWidth.Medium}
                    >
                        <EmergencyContactSubpage app={APPS.PROTONACCOUNTLITE} />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.signedInReset)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={c('Title').t`Signed-in reset`}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={advancedRecovery.subroutes.signedInReset.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <SessionRecoverySubpage />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.qrCode)}>
                    <PrivateMainSubSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        title={c('Title').t`QR code sign-in`}
                        backTo={recoveryPath}
                        backLabel={c('Title').t`Recovery`}
                        variant={advancedRecovery.subroutes.qrCode.variant}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <SignInWithAnotherDeviceSubpage />
                    </PrivateMainSubSettingsArea>
                </Route>
                <Route>
                    <PrivateMainSettingsArea
                        mainAreaClass={'lite-app-account-settings'}
                        config={{
                            ...routeConfig,
                            subsections: [
                                ...(routeConfig.subsections ?? []),
                                { id: passwordReset.id, invisibleTitle: true },
                                {
                                    id: dataRecovery.id,
                                    invisibleTitle: true,
                                    available: Object.values(dataRecovery.subroutes).some((s) => s.available !== false),
                                },
                                { id: advancedRecovery.id, invisibleTitle: true },
                            ],
                        }}
                        maxWidth={SettingsCardMaxWidth.Medium}
                        variant={SettingsLayoutVariant.Card}
                    >
                        <OverviewSectionV2 variant={SettingsLayoutVariant.Mobile} />
                        <SettingsNavGroup
                            title={passwordReset.title}
                            description={passwordReset.description}
                            subsections={Object.values(passwordReset.subroutes)}
                            variant={SettingsLayoutVariant.Mobile}
                        >
                            <RecoveryEmail to={getSubroutePath(recoveryPath, passwordReset.subroutes.email)} />
                            <RecoveryPhone to={getSubroutePath(recoveryPath, passwordReset.subroutes.phone)} />
                        </SettingsNavGroup>
                        <SettingsNavGroup
                            title={dataRecovery.title}
                            description={dataRecovery.description}
                            subsections={Object.values(dataRecovery.subroutes)}
                            variant={SettingsLayoutVariant.Mobile}
                        >
                            <PasswordResetOptionRequiredWarningInGroup
                                emailSubpagePath={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}
                            />
                            <RecoveryDevice to={getSubroutePath(recoveryPath, dataRecovery.subroutes.deviceRecovery)} />
                            <RecoveryFile to={getSubroutePath(recoveryPath, dataRecovery.subroutes.backupFile)} />
                            <RecoveryContacts
                                to={getSubroutePath(recoveryPath, dataRecovery.subroutes.recoveryContacts)}
                            />
                        </SettingsNavGroup>
                        <SettingsNavGroup
                            title={advancedRecovery.title}
                            description={advancedRecovery.description}
                            subsections={Object.values(advancedRecovery.subroutes)}
                            variant={SettingsLayoutVariant.Mobile}
                        >
                            <RecoveryPhrase to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.phrase)} />
                            <SignedInReset
                                to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.signedInReset)}
                            />
                            <RecoveryQrCode to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.qrCode)} />
                            <EmergencyContacts
                                to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.emergencyContacts)}
                            />
                        </SettingsNavGroup>
                    </PrivateMainSettingsArea>
                </Route>
            </Switch>
        </RecoverySettingsTelemetryVariantProvider>
    );
};

export default RecoveryPage;
