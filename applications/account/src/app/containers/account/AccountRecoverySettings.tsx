import { useState } from 'react';
import { SectionConfig, SettingsPropsShared, useIsDataRecoveryAvailable } from '@proton/components';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { UserModel } from '@proton/shared/lib/interfaces';
import { AccountRecoverySection, DataRecoverySection, OverviewSection } from '@proton/components/containers/recovery';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const ids = {
    account: 'account',
    data: 'data',
};

const recoveryPageConfig: SectionConfig = {
    text: c('Title').t`Recovery`,
    to: '/recovery',
    icon: 'key',
};

export const hasRecoverySettings = (user: UserModel) => user.isPrivate;

export const getRecoveryPage = (showNotification: boolean): SectionConfig => {
    return {
        ...recoveryPageConfig,
        notification: showNotification,
    };
};

const getRecoveryPageWithSubsections = (dataRecoveryMethodAvailable: boolean): SectionConfig => {
    return {
        ...recoveryPageConfig,
        subsections: [
            {
                id: 'checklist',
            },
            {
                text: c('Title').t`Account recovery`,
                id: ids.account,
            },
            dataRecoveryMethodAvailable && {
                text: c('Title').t`Data recovery`,
                id: ids.data,
            },
        ].filter(isTruthy),
    };
};

const AccountRecoverySettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    const [isDataRecoveryAvailable] = useIsDataRecoveryAvailable();

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getRecoveryPageWithSubsections(isDataRecoveryAvailable)}
            setActiveSection={setActiveSection}
        >
            <OverviewSection ids={ids} />
            <AccountRecoverySection />
            {isDataRecoveryAvailable && (
                <DataRecoverySection openMnemonicModal={action === 'generate-recovery-phrase'} />
            )}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountRecoverySettings;
