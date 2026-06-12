import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import usePrevious from '@proton/hooks/usePrevious';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { ApiImporterOrganizationState } from '../../api/api.interface';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '../../interface';
import { setupMigration } from '../thunk';
import type { MigrationConfiguration, MigrationModel, MigrationSetupModel } from '../types';
import { useConnectionState } from '../useConnectionState';
import { useImporterOrganizations } from '../useImporterOrganizations';
import { useProviderTokens } from '../useProviderTokens';
import { useProviderUsers } from '../useProviderUsers';
import { CircledLogoWithProton } from './CircledLogoWithProton';
import FinishModal from './MigrationAssistant/FinishModal';
import MigrationSummary from './MigrationAssistant/MigrationSummary';
import MigrationSetup from './MigrationSetup/MigrationSetup';

const SETUP_DEFAULTS: MigrationConfiguration = {
    selectedProducts: ['Mail', 'Contacts', 'Calendar'],
    tokens: [],
    notifyList: [],
    transferErrors: [],
    timePeriod: 'all',
    importOrganizationSettings: true,

    connectionState: undefined,
    importerOrganizationId: undefined,
    domain: undefined,
    domainName: undefined,
    state: undefined,
    joiningLink: undefined,
    domainRegistrarId: 0,
};

const MigrationFlow = () => {
    const dispatch = useDispatch();
    const [customDomains] = useCustomDomains();
    const [importerOrganizations] = useImporterOrganizations();
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE, [EASY_SWITCH_FEATURES.OLES]);
    const [connectionState] = useConnectionState(tokens);
    const [migrationConfig, setMigrationConfig] = useState<MigrationConfiguration>();
    const [providerUsers] = useProviderUsers(migrationConfig?.domainName);
    const [finishModalProps, setFinishModalOpen, renderFinishModal] = useModalState();
    const loading = !customDomains || !importerOrganizations || !tokens || !connectionState || !providerUsers;

    const onMigrationSetupSubmit = async (payload: MigrationConfiguration) => {
        const migrationConfig = await dispatch(setupMigration(payload)).unwrap();
        setMigrationConfig(migrationConfig);
    };

    const onUpdate = (diff: Partial<MigrationConfiguration>) =>
        setMigrationConfig((prev) => ({ ...(prev || SETUP_DEFAULTS), ...diff }));

    useEffect(() => {
        if (!importerOrganizations?.length) {
            return;
        }

        const [{ ImporterConfig, ImporterOrganizationID, DomainName, JoiningLink, State }] = importerOrganizations;

        onUpdate({
            importerOrganizationId: ImporterOrganizationID,
            selectedProducts: ImporterConfig.Products,
            domainName: DomainName,
            importOrganizationSettings: ImporterConfig.ImportOrganizationSettings,
            joiningLink: JoiningLink,
            state: State,
        });
    }, [importerOrganizations]);

    const domainName = (() => {
        if (migrationConfig?.domainName) {
            return migrationConfig.domainName;
        }

        if (!tokens || !tokens.length) {
            return undefined;
        }

        return getEmailParts(tokens[0].Account)[1];
    })();

    const domain = customDomains?.find((d) => d.DomainName === domainName);

    const model: MigrationSetupModel = {
        ...(migrationConfig || SETUP_DEFAULTS),
        domainName,
        domain,
        tokens,
        connectionState,
        update: onUpdate,
    };

    const prevModelState = usePrevious(model.state);
    useEffect(() => {
        if (
            prevModelState === null ||
            prevModelState === undefined ||
            prevModelState >= ApiImporterOrganizationState.COMPLETED ||
            model.state !== ApiImporterOrganizationState.COMPLETED
        ) {
            return;
        }

        setFinishModalOpen(true);
    }, [model.state]);

    return (
        <div className="relative flex-1 flex flex-column flex-nowrap">
            <div className="w-full flex flex-nowrap items-center justify-space-between py-5 px-4 xl:px-8 border-bottom border-top border-weak">
                <div className="flex flex-nowrap items-center mr-2">
                    <CircledLogoWithProton iconPosition="outside-bottom-right" className="shrink-0 mb-1" />
                    <h2 className="text-2xl text-bold ml-4 my-0">{c('BOSS').t`Migrate from Google Workspace`}</h2>
                </div>
                <Href
                    href={getKnowledgeBaseUrl('/easy-switch-for-business')}
                    className="inline-block text-no-decoration shrink-0"
                >
                    {c('Link').t`Help & support`}
                </Href>
            </div>

            {loading && (
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
            )}

            {!loading && Boolean(!model.state || model.state < ApiImporterOrganizationState.COMPLETED) && (
                <MigrationSetup model={model} onSubmit={onMigrationSetupSubmit} />
            )}

            {!loading && Boolean(model.state && model.state >= ApiImporterOrganizationState.COMPLETED) && (
                <MigrationSummary model={model as MigrationModel} />
            )}

            {renderFinishModal && model.domain && <FinishModal initialView={'all-set'} modalProps={finishModalProps} />}
        </div>
    );
};

export default MigrationFlow;
