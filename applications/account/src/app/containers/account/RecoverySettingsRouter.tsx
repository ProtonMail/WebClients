import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { EmergencyContactSection } from '@proton/account/delegatedAccess/emergencyContact/EmergencyContactSection';
import { RecoveryContactSection } from '@proton/account/delegatedAccess/recoveryContact/RecoveryContactSection';
import type { SubrouteConfig, SubrouteGroup } from '@proton/components';
import {
    AccountRecoverySection,
    DataRecoverySection,
    OverviewSection,
    PrivateMainSettingsArea,
    PrivateMainSubSettingsArea,
    RecoveryPageTelemetry,
    SessionRecoverySection,
    SettingsNavGroup,
} from '@proton/components';
import { getSectionPath, getSubroutePath } from '@proton/components/containers/layout/helper';
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
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import DeviceBasedRecoverySubpage from './recoverySubpages/DeviceBasedRecoverySubpage';
import { EmergencyContactSubpage } from './recoverySubpages/EmergencyContactSubpage';
import { RecoveryContactSubpage } from './recoverySubpages/RecoveryContactSubpage';
import RecoveryEmailSubpage from './recoverySubpages/RecoveryEmailSubpage';
import RecoveryFileSubpage from './recoverySubpages/RecoveryFileSubpage';
import RecoveryPhoneSubpage from './recoverySubpages/RecoveryPhoneSubpage';
import RecoveryPhraseSubpage from './recoverySubpages/RecoveryPhraseSubpage';
import { SessionRecoverySubpage } from './recoverySubpages/SessionRecoverySubpage';
import SignInWithAnotherDeviceSubpage from './recoverySubpages/SignInWithAnotherDeviceSubpage';
import type { getAccountAppRoutes } from './routes';

interface Props {
    app: APP_NAMES;
    recovery: ReturnType<typeof getAccountAppRoutes>['routes']['recovery'];
    path: string;
}

const RecoverySettingsRouter = ({ app, recovery, path }: Props) => {
    const isRecoverySettingsRedesignEnabled = useFlag('RecoverySettingsRedesign');
    const recoverySubrouteGroups = 'subrouteGroups' in recovery ? recovery.subrouteGroups : undefined;
    const sr = Object.assign({}, ...(recoverySubrouteGroups?.map((g) => g.subroutes) ?? [])) as Record<
        string,
        SubrouteConfig
    >;
    const [passwordResetGroup, dataRecoveryGroup, advancedRecoveryGroup] = (recoverySubrouteGroups ?? []) as [
        SubrouteGroup,
        SubrouteGroup,
        SubrouteGroup,
    ];

    const recoveryPath = getSectionPath(path, recovery);

    return (
        <>
            <RecoveryPageTelemetry />
            {isRecoverySettingsRedesignEnabled && recoverySubrouteGroups ? (
                <Switch>
                    <Route path={getSubroutePath(recoveryPath, sr.email)}>
                        <PrivateMainSubSettingsArea
                            title={sr.email.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.email.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <RecoveryEmailSubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.phone)}>
                        <PrivateMainSubSettingsArea
                            title={sr.phone.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.phone.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <RecoveryPhoneSubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.deviceRecovery)}>
                        <PrivateMainSubSettingsArea
                            title={sr.deviceRecovery.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.deviceRecovery.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <DeviceBasedRecoverySubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.backupFile)}>
                        <PrivateMainSubSettingsArea
                            title={sr.backupFile.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.backupFile.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <RecoveryFileSubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.phrase)}>
                        <PrivateMainSubSettingsArea
                            title={c('Title').t`Recovery phrase`}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.phrase.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <RecoveryPhraseSubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.recoveryContacts)}>
                        <PrivateMainSubSettingsArea
                            title={sr.recoveryContacts.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.recoveryContacts.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <RecoveryContactSubpage
                                app={app}
                                emailSubpagePath={getSubroutePath(recoveryPath, sr.email)}
                            />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.emergencyContacts)}>
                        <PrivateMainSubSettingsArea
                            title={sr.emergencyContacts.text}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.emergencyContacts.variant}
                            maxWidth={SettingsCardMaxWidth.Medium}
                        >
                            <EmergencyContactSubpage app={app} />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.signedInReset)}>
                        <PrivateMainSubSettingsArea
                            title={c('Title').t`Signed-in reset`}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.signedInReset.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <SessionRecoverySubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route path={getSubroutePath(recoveryPath, sr.qrCode)}>
                        <PrivateMainSubSettingsArea
                            title={c('Title').t`QR code sign-in`}
                            backTo={recoveryPath}
                            backLabel={c('Title').t`Recovery`}
                            variant={sr.qrCode.variant}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <SignInWithAnotherDeviceSubpage />
                        </PrivateMainSubSettingsArea>
                    </Route>
                    <Route>
                        <PrivateMainSettingsArea
                            config={{
                                ...recovery,
                                subsections: [
                                    ...(recovery.subsections ?? []),
                                    { id: passwordResetGroup.id, invisibleTitle: true },
                                    {
                                        id: dataRecoveryGroup.id,
                                        invisibleTitle: true,
                                        available: Object.values(dataRecoveryGroup.subroutes).some(
                                            (s) => s.available !== false
                                        ),
                                    },
                                    { id: advancedRecoveryGroup.id, invisibleTitle: true },
                                ],
                            }}
                            maxWidth={SettingsCardMaxWidth.Medium}
                            variant={SettingsLayoutVariant.Card}
                        >
                            <OverviewSectionV2 />
                            <SettingsNavGroup
                                title={passwordResetGroup.title}
                                description={passwordResetGroup.description}
                                subsections={Object.values(passwordResetGroup.subroutes)}
                            >
                                <RecoveryEmail to={getSubroutePath(recoveryPath, sr.email)} />
                                <RecoveryPhone to={getSubroutePath(recoveryPath, sr.phone)} />
                            </SettingsNavGroup>
                            <SettingsNavGroup
                                title={dataRecoveryGroup.title}
                                description={dataRecoveryGroup.description}
                                subsections={Object.values(dataRecoveryGroup.subroutes)}
                            >
                                <RecoveryDevice to={getSubroutePath(recoveryPath, sr.deviceRecovery)} />
                                <RecoveryFile to={getSubroutePath(recoveryPath, sr.backupFile)} />
                                <RecoveryContacts to={getSubroutePath(recoveryPath, sr.recoveryContacts)} />
                            </SettingsNavGroup>
                            <SettingsNavGroup
                                title={advancedRecoveryGroup.title}
                                description={advancedRecoveryGroup.description}
                                subsections={Object.values(advancedRecoveryGroup.subroutes)}
                            >
                                <RecoveryPhrase to={getSubroutePath(recoveryPath, sr.phrase)} />
                                <SignedInReset to={getSubroutePath(recoveryPath, sr.signedInReset)} />
                                <RecoveryQrCode to={getSubroutePath(recoveryPath, sr.qrCode)} />
                                <EmergencyContacts to={getSubroutePath(recoveryPath, sr.emergencyContacts)} />
                            </SettingsNavGroup>
                        </PrivateMainSettingsArea>
                    </Route>
                </Switch>
            ) : (
                <PrivateMainSettingsArea config={recovery}>
                    <OverviewSection />
                    <AccountRecoverySection />
                    <DataRecoverySection />
                    <EmergencyContactSection app={app} />
                    <RecoveryContactSection app={app} />
                    <SessionRecoverySection />
                </PrivateMainSettingsArea>
            )}
        </>
    );
};

export default RecoverySettingsRouter;
