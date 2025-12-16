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
    const [migrationConfig, setMigrationConfig] = useState<MigrationConfiguration>();
    const loading = customDomainsLoading || importerOrganizationLoading;

    const onMigrationSetupSubmit = async (payload: MigrationSetupModel) => {
        const result = await api<ApiImporterOrganization>(
            createOrganizationImporter({
                Provider: ApiImportProvider.GOOGLE,
                Products: payload.selectedProducts,
            })
        );

        setMigrationConfig({
            ...payload,
            importerOrganizationId: result.ImporterOrganizationID,
        });
    };

    useEffect(() => {
        if (loading || !importerOrganization) {
            return;
        }

        try {
            const { ImporterConfig, ImporterOrganizationID } = importerOrganization;

            setMigrationConfig({
                importerOrganizationId: ImporterOrganizationID,
                domain: customDomains?.find((d) => d.DomainName === importerOrganization.DomainName),
                selectedProducts: ImporterConfig.Products,
                notifyList: [],
                timePeriod: 'all',
            });
        } catch {}
    }, [importerOrganization, customDomains, loading]);

    const component = (() => {
        if (customDomainsLoading || importerOrganizationLoading) {
            return <SkeletonLoader />;
        }

        if (!migrationConfig) {
            return <MigrationSetup onSubmit={onMigrationSetupSubmit} />;
        }

        return <MigrationAssistant config={migrationConfig} />;
    })();

    return (
        <div className="flex-1 flex flex-column">
            <div className="w-full flex items-center p-4 border-bottom border-top border-weak">
                <img src={protonGoogleIcon} alt="" width={48} />
                <p className="text-xl text-bold ml-4 my-0">{c('BOSS').t`Migrate from Google Workspace`}</p>
            </div>

            {component}
        </div>
    );
};

export default MigrationFlow;
