import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { EllipsisLoader } from '@proton/components/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

import { ApiImporterOrganizationState } from '../../api/api.interface';
import { setupMigration } from '../thunk';
import type { MigrationConfiguration, MigrationModel, MigrationSetupModel } from '../types';
import { useImporterOrganizations } from '../useImporterOrganizations';
import { CircledLogoWithProton } from './CircledLogoWithProton';
import MigrationAssistant from './MigrationAssistant/MigrationAssistant';
import MigrationSetup from './MigrationSetup/MigrationSetup';

const MigrationFlow = () => {
    const dispatch = useDispatch();
    const [customDomains] = useCustomDomains();
    const [importerOrganizations] = useImporterOrganizations();
    const [migrationConfig, setMigrationConfig] = useState<MigrationConfiguration>({
        importerOrganizationId: undefined,
        domainName: undefined,
        selectedProducts: ['Mail', 'Contacts', 'Calendar'],
        notifyList: [],
        timePeriod: 'all',
        importOrganizationSettings: true,
        joiningLink: undefined,
        state: ApiImporterOrganizationState.INITIALIZED,
    });
    const loading = !customDomains || !importerOrganizations;

    const onMigrationSetupSubmit = async (payload: MigrationConfiguration) => {
        const migrationConfig = await dispatch(setupMigration(payload)).unwrap();
        setMigrationConfig(migrationConfig);
    };

    useEffect(() => {
        if (loading || !importerOrganizations?.length) {
            return;
        }

        const { ImporterConfig, ImporterOrganizationID, DomainName, JoiningLink, State } = importerOrganizations[0];

        setMigrationConfig((config) => ({
            ...config,
            importerOrganizationId: ImporterOrganizationID,
            selectedProducts: ImporterConfig.Products,
            domainName: DomainName,
            importOrganizationSettings: ImporterConfig.ImportOrganizationSettings,
            joiningLink: JoiningLink,
            state: State,
        }));
    }, [importerOrganizations, loading]);

    const model: MigrationSetupModel & MigrationModel = {
        ...migrationConfig,
        setSelectedProducts: (products) => setMigrationConfig((state) => ({ ...state, selectedProducts: products })),
        setNotifyList: (emails) => setMigrationConfig((state) => ({ ...state, notifyList: emails })),
        setTimePeriod: (timePeriod) => setMigrationConfig((state) => ({ ...state, timePeriod })),
        setImportOrganizationSettings: (importOrganizationSettings) =>
            setMigrationConfig((state) => ({ ...state, importOrganizationSettings })),
        setDomainName: (domainName) => setMigrationConfig((state) => ({ ...state, domainName })),
        update: setMigrationConfig,
    };

    const component = (() => {
        if (loading) {
            return (
                <div className="flex-1 h-full w-full flex flex-nowrap">
                    <div className="m-auto text-center">
                        <CircleLoader size="large" />
                        <br />
                        <div className="color-weak mt-2">
                            {c('BOSS').t`Loading your organization data`}
                            <EllipsisLoader />
                        </div>
                    </div>
                </div>
            );
        }

        if (!migrationConfig.importerOrganizationId) {
            return <MigrationSetup model={model} onSubmit={onMigrationSetupSubmit} />;
        }

        return <MigrationAssistant model={model} />;
    })();

    return (
        <div className="relative flex-1 flex flex-column flex-nowrap">
            <div className="w-full flex flex-nowrap items-center py-5 px-4 xl:px-8 border-bottom border-top border-weak">
                <CircledLogoWithProton iconPosition="outside-bottom-right" className="shrink-0 mb-1" />
                <h2 className="text-2xl text-bold ml-4 my-0">{c('BOSS').t`Migrate from Google Workspace`}</h2>
            </div>

            {component}
        </div>
    );
};

export default MigrationFlow;
