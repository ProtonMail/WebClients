import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { ApiImportProvider, type ApiImporterOrganization } from '@proton/activation/src/api/api.interface';
import { SkeletonLoader, useApi } from '@proton/components';
import protonGoogleIcon from '@proton/styles/assets/img/migration-assistant/proton-google.svg';

import { createOrganizationImporter } from '../../api';
import type { MigrationConfiguration, MigrationSetupModel } from '../types';
import { useImporterOrganization } from '../useImporterOrganization';
import MigrationAssistant from './MigrationAssistant/MigrationAssistant';
import MigrationSetup from './MigrationSetup/MigrationSetup';

const MigrationFlow = () => {
    const api = useApi();
    const [customDomains, customDomainsLoading] = useCustomDomains();
    const [importerOrganization, importerOrganizationLoading] = useImporterOrganization();
    const [migrationConfig, setMigrationConfig] = useState<MigrationConfiguration>({
        importerOrganizationId: undefined,
        domainName: undefined,
        selectedProducts: ['Mail', 'Contacts', 'Calendar'],
        notifyList: [],
        timePeriod: 'all',
        importOrganizationSettings: true,
    });
    const loading = customDomainsLoading || importerOrganizationLoading;

    const onMigrationSetupSubmit = async (payload: MigrationConfiguration) => {
        const result = await api<ApiImporterOrganization>(
            createOrganizationImporter({
                Provider: ApiImportProvider.GOOGLE,
                Products: payload.selectedProducts,
                ImportOrganizationSettings: payload.importOrganizationSettings,
            })
        );

        setMigrationConfig({
            ...payload,
            importerOrganizationId: result.ImporterOrganizationID,
            domainName: result.DomainName,
        });
    };

    useEffect(() => {
        if (loading || !importerOrganization) {
            return;
        }

        const { ImporterConfig, ImporterOrganizationID, DomainName } = importerOrganization;

        setMigrationConfig((config) => ({
            ...config,
            importerOrganizationId: ImporterOrganizationID,
            selectedProducts: ImporterConfig.Products,
            domainName: DomainName,
            importOrganizationSettings: ImporterConfig.ImportOrganizationSettings,
        }));
    }, [importerOrganization, customDomains, loading]);

    const model: MigrationSetupModel = {
        ...migrationConfig,
        setSelectedProducts: (products) => setMigrationConfig((state) => ({ ...state, selectedProducts: products })),
        setNotifyList: (emails) => setMigrationConfig((state) => ({ ...state, notifyList: emails })),
        setTimePeriod: (timePeriod) => setMigrationConfig((state) => ({ ...state, timePeriod })),
        setImportOrganizationSettings: (importOrganizationSettings) =>
            setMigrationConfig((state) => ({ ...state, importOrganizationSettings })),
    };

    const component = (() => {
        if (customDomainsLoading || importerOrganizationLoading) {
            return <SkeletonLoader />;
        }

        if (!migrationConfig.importerOrganizationId) {
            return <MigrationSetup model={model} onSubmit={onMigrationSetupSubmit} />;
        }

        return <MigrationAssistant model={model} />;
    })();

    return (
        <div className="flex-1 flex flex-column flex-nowrap">
            <div className="w-full flex items-center p-4 border-bottom border-top border-weak">
                <img src={protonGoogleIcon} alt="" className="shrink-0" width={48} />
                <h2 className="text-xl text-bold ml-4 my-0">{c('BOSS').t`Migrate from Google Workspace`}</h2>
            </div>

            {component}
        </div>
    );
};

export default MigrationFlow;
