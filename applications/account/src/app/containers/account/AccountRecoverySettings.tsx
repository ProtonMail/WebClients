import { useEffect, useRef, useState } from 'react';
import {
    FeatureCode,
    SectionConfig,
    SettingsPropsShared,
    NotificationDotColor,
    useFeature,
    useIsDataRecoveryAvailable,
} from '@proton/components';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { UserModel } from '@proton/shared/lib/interfaces';
import { AccountRecoverySection, DataRecoverySection, OverviewSection } from '@proton/components/containers/recovery';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const ids = {
    account: 'account',
    data: 'data',
};

const getSharedConfig = () => {
    return { text: c('Title').t`Recovery`, to: '/recovery', icon: 'key' };
};

export const hasRecoverySettings = (user: UserModel) => user.isPrivate;

export const getRecoveryPage = (notification?: NotificationDotColor): SectionConfig => {
    return {
        ...getSharedConfig(),
        notification,
    };
};

const getRecoveryPageWithSubsections = (dataRecoveryMethodAvailable: boolean): SectionConfig => {
    return {
        ...getSharedConfig(),
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
    const openRecoverDataModalRef = useRef(action === 'recover-data');
    const openMnemonicModalRef = useRef(action === 'generate-recovery-phrase');

    const [isDataRecoveryAvailable] = useIsDataRecoveryAvailable();

    const { feature: hasVisitedRecoveryPage, update: setVisitedRecoveryPage } = useFeature(
        FeatureCode.VisitedRecoveryPage
    );

    useEffect(() => {
        if (hasVisitedRecoveryPage?.Value === false) {
            setVisitedRecoveryPage(true);
        }
    }, [hasVisitedRecoveryPage]);

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getRecoveryPageWithSubsections(isDataRecoveryAvailable)}
            setActiveSection={setActiveSection}
        >
            <OverviewSection ids={ids} openRecoverDataModalRef={openRecoverDataModalRef} />
            <AccountRecoverySection />
            {isDataRecoveryAvailable && <DataRecoverySection openMnemonicModalRef={openMnemonicModalRef} />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountRecoverySettings;
