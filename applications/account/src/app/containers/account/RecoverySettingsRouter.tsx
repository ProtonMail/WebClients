import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { EmergencyContactSection } from '@proton/account/delegatedAccess/emergencyContact/EmergencyContactSection';
import { RecoveryContactSection } from '@proton/account/delegatedAccess/recoveryContact/RecoveryContactSection';
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

const RedesignRecoverySettingsRouter = ({ app, recovery, path }: Props) => {
    const recoverySubrouteGroups = recovery.subrouteGroups;
    if (!recoverySubrouteGroups) {
        throw new Error('Missing sub groups');
    }
    const { passwordReset, dataRecovery, advancedRecovery } = recoverySubrouteGroups;

    const recoveryPath = getSectionPath(path, recovery);

    return (
        <Switch>
            <Route path={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}>
                <PrivateMainSubSettingsArea
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
                    title={dataRecovery.subroutes.recoveryContacts.text}
                    backTo={recoveryPath}
                    backLabel={c('Title').t`Recovery`}
                    variant={dataRecovery.subroutes.recoveryContacts.variant}
                    maxWidth={SettingsCardMaxWidth.Narrow}
                >
                    <RecoveryContactSubpage
                        app={app}
                        emailSubpagePath={getSubroutePath(recoveryPath, passwordReset.subroutes.email)}
                    />
                </PrivateMainSubSettingsArea>
            </Route>
            <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.emergencyContacts)}>
                <PrivateMainSubSettingsArea
                    title={advancedRecovery.subroutes.emergencyContacts.text}
                    backTo={recoveryPath}
                    backLabel={c('Title').t`Recovery`}
                    variant={advancedRecovery.subroutes.emergencyContacts.variant}
                    maxWidth={SettingsCardMaxWidth.Medium}
                >
                    <EmergencyContactSubpage app={app} />
                </PrivateMainSubSettingsArea>
            </Route>
            <Route path={getSubroutePath(recoveryPath, advancedRecovery.subroutes.signedInReset)}>
                <PrivateMainSubSettingsArea
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
                    config={{
                        ...recovery,
                        subsections: [
                            ...(recovery.subsections ?? []),
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
                    <OverviewSectionV2 />
                    <SettingsNavGroup
                        title={passwordReset.title}
                        description={passwordReset.description}
                        subsections={Object.values(passwordReset.subroutes)}
                    >
                        <RecoveryEmail to={getSubroutePath(recoveryPath, passwordReset.subroutes.email)} />
                        <RecoveryPhone to={getSubroutePath(recoveryPath, passwordReset.subroutes.phone)} />
                    </SettingsNavGroup>
                    <SettingsNavGroup
                        title={dataRecovery.title}
                        description={dataRecovery.description}
                        subsections={Object.values(dataRecovery.subroutes)}
                    >
                        <RecoveryDevice to={getSubroutePath(recoveryPath, dataRecovery.subroutes.deviceRecovery)} />
                        <RecoveryFile to={getSubroutePath(recoveryPath, dataRecovery.subroutes.backupFile)} />
                        <RecoveryContacts to={getSubroutePath(recoveryPath, dataRecovery.subroutes.recoveryContacts)} />
                    </SettingsNavGroup>
                    <SettingsNavGroup
                        title={advancedRecovery.title}
                        description={advancedRecovery.description}
                        subsections={Object.values(advancedRecovery.subroutes)}
                    >
                        <RecoveryPhrase to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.phrase)} />
                        <SignedInReset to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.signedInReset)} />
                        <RecoveryQrCode to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.qrCode)} />
                        <EmergencyContacts
                            to={getSubroutePath(recoveryPath, advancedRecovery.subroutes.emergencyContacts)}
                        />
                    </SettingsNavGroup>
                </PrivateMainSettingsArea>
            </Route>
        </Switch>
    );
};

const RecoverySettingsRouter = ({ app, recovery, path }: Props) => {
    const isRecoverySettingsRedesignEnabled = useFlag('RecoverySettingsRedesign');
    const recoveryPath = getSectionPath(path, recovery);
    const location = useLocation();

    const showRedesign = isRecoverySettingsRedesignEnabled && !!recovery.subrouteGroups;

    if (showRedesign && location.pathname === recoveryPath) {
        const params = new URLSearchParams(location.search);
        const action = params.get('action');
        const { dataRecovery, advancedRecovery } = recovery.subrouteGroups;

        if (action === 'view') {
            return (
                <Redirect
                    to={{
                        pathname: getSubroutePath(recoveryPath, advancedRecovery.subroutes.emergencyContacts),
                        search: location.search,
                    }}
                />
            );
        } else if (action === 'generate-recovery-phrase') {
            return (
                <Redirect
                    to={{
                        pathname: getSubroutePath(recoveryPath, advancedRecovery.subroutes.phrase),
                        search: location.search,
                    }}
                />
            );
        } else if (action === 'help-recover' || action === 'recover-info' || action === 'recover-token') {
            return (
                <Redirect
                    to={{
                        pathname: getSubroutePath(recoveryPath, dataRecovery.subroutes.recoveryContacts),
                        search: location.search,
                    }}
                />
            );
        }
    }

    return (
        <>
            <RecoveryPageTelemetry />
            {showRedesign ? (
                <RedesignRecoverySettingsRouter app={app} recovery={recovery} path={path} />
            ) : (
                <Switch>
                    <Route exact path={recoveryPath}>
                        <PrivateMainSettingsArea config={recovery}>
                            <OverviewSection />
                            <AccountRecoverySection />
                            <DataRecoverySection />
                            <EmergencyContactSection app={app} />
                            <RecoveryContactSection app={app} />
                            <SessionRecoverySection />
                        </PrivateMainSettingsArea>
                    </Route>
                    <Redirect to={recoveryPath} />
                </Switch>
            )}
        </>
    );
};

export default RecoverySettingsRouter;
