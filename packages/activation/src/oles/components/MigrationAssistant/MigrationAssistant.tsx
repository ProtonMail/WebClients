import { type FC, useState, useEffect } from 'react';

import { c, msgid } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import {
    type ApiImporterProduct,
    ProductStatusState,
} from '@proton/activation/src/api/api.interface';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { SkeletonLoader, useNotifications } from '@proton/components';
import { useDispatch } from '@proton/redux-shared-store';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import { createMigrationBatch } from '../../thunk';
import type { MigrationSetupModel } from '../../types';
import { useProviderTokens } from '../../useProviderTokens';
import { useProviderUsers } from '../../useProviderUsers';
import DomainSetup from './DomainSetup';
import { coalesceStatus } from './ImportStatus';
import ProviderUsersTable from './ProviderUsersTable';

const MigrationAssistant: FC<{ model: MigrationSetupModel }> = ({ model }) => {
    const { createNotification } = useNotifications();
    const [customDomains] = useCustomDomains();
    const [providerUsers, , refreshProviderUsers] = useProviderUsers(model.importerOrganizationId!);
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE);
    const dispatch = useDispatch();

    const loading = !providerUsers || !tokens || !customDomains;

    const domain = customDomains?.find((d) => d.DomainName === model.domainName);
    
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const selectableUsers = providerUsers?.filter(u => !u.ImporterOrganizationUser).map(u => u.ID) ?? [];
    const filteredSelected = selectedUsers.filter(u => selectableUsers.includes(u));

    const [migrating, setMigrating] = useState<boolean>(false);
    const migratingDisabled = migrating || !selectedUsers.length || !domain || !getIsDomainActive(domain);

    const migratedCount =
        providerUsers?.filter(
            (u) =>
                u.ImporterOrganizationUser &&
                coalesceStatus(u.ImporterOrganizationUser.ProductStatuses) === ProductStatusState.Completed
        ).length ?? 0;

    const hasIncompleteUsers =
        providerUsers?.some((u) => {
            const status = coalesceStatus(u.ImporterOrganizationUser?.ProductStatuses);
            return status && status !== ProductStatusState.Error && status !== ProductStatusState.Completed;
        }) ?? false;

    useEffect(() => {
        if (!hasIncompleteUsers) {
            return;
        }

        const interval = setInterval(() => refreshProviderUsers(), 30_000);
        return () => clearInterval(interval);
    }, [hasIncompleteUsers, refreshProviderUsers]);

    if (loading) {
        return <SkeletonLoader />;
    }

    const getMigrationStartedText = (n: number) =>
        c('BOSS').ngettext(msgid`Migration started for ${n} user`, `Migration started for ${n} users`, n);

    const getMigrationUnavailableReason = () => {
        if (!selectedUsers.length) {
            return c('BOSS').t`Select at least one user to start a migration`;
        }

        if (!domain || !getIsDomainActive(domain)) {
            return c('BOSS').t`Verify your domain to start a migration`;
        }
    };

    const migrationIncludesText = (() => {
        const translations: Record<ApiImporterProduct | 'Settings', string> = {
            Mail: c('BOSS').t`Mail`,
            Calendar: c('BOSS').t`Calendar`,
            Contacts: c('BOSS').t`Contacts`,
            Settings: c('BOSS').t`Settings`,
        };

        const included = [
            ...model.selectedProducts.map((p) => translations[p]),
            ...(model.importOrganizationSettings ? [translations.Settings] : []),
        ];

        return included.join(', ');
    })();

    const handleMigrateUsers = async () => {
        setMigrating(true);

        const usersToImport = providerUsers.filter((u) => selectedUsers.includes(u.ID));

        const result = await dispatch(
            createMigrationBatch({
                importerOrganizationId: model.importerOrganizationId!,
                domain: domain!,
                users: usersToImport,
                oauthToken: tokens[0],
            }) as any
        );

        if (result.meta.requestStatus === 'fulfilled') {
            createNotification({
                text: getMigrationStartedText(usersToImport.length),
            });
        } else {
            createNotification({
                text: result.error.message ?? 'Unknown error',
                type: 'error',
            });
        }

        await refreshProviderUsers().catch(noop);
        setMigrating(false);
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-custom p-4" style={{ '--max-w-custom': '60rem' }}>
                <h3 className="sr-only" id="migration-status">{c('BOSS').t`Migration status`}</h3>
                <section className="flex gap-4 mb-12" aria-labelledby="migration-status">
                    {/* Users migrated */}
                    <Card
                        rounded
                        background={false}
                        className="shadow-norm flex px-0 bg-elevated border-weak rounded-xl"
                    >
                        <div className="flex divide-x divide-weak my-2">
                            <div className="px-6">
                                <div className="color-weak mb-1">{c('BOSS').t`Users migrated`}</div>
                                <div className="text-bold text-xl text-tabular-nums">
                                    {migratedCount} of {providerUsers.length}
                                </div>
                            </div>
                            <div className="px-6">
                                <div className="color-weak mb-1">{c('BOSS').t`Transfer errors`}</div>
                                <div className="text-bold text-xl text-tabular-nums">0</div>
                            </div>
                        </div>
                    </Card>

                    {/* Migration includes */}
                    <Card
                        rounded
                        background={false}
                        className="shadow-norm flex px-0 bg-elevated border-weak rounded-xl"
                    >
                        <div className="flex my-2 px-6 flex-column flex-nowrap gap-1">
                            <span className="color-weak">{c('BOSS').t`Migration includes`}</span>
                            <div className="text-xl text-capitalize">{migrationIncludesText}</div>
                        </div>
                    </Card>
                </section>

                {/* Domain setup */}
                <DomainSetup model={model} domain={domain} />

                {/* Migrate users */}
                <section className="mb-12" aria-labelledby="migrate-users">
                    <div className="flex justify-space-between items-center mb-4">
                        <h3 className="text-xl text-semibold" id="migrate-users">{c('BOSS').t`Migrate users`}</h3>
                    </div>
                    <Card
                        padded={false}
                        rounded
                        background={false}
                        className="shadow-norm flex bg-elevated border-weak rounded-xl overflow-hidden"
                    >
                        <div className="px-6 py-4 flex flex-nowrap items-center gap-2 w-full border-bottom border-weak">
                            <div className="flex-1"></div>
                            <Tooltip title={getMigrationUnavailableReason()} openDelay={0}>
                                <div className="inline-block">
                                    <Button
                                        color="norm"
                                        onClick={handleMigrateUsers}
                                        disabled={migratingDisabled}
                                        className="shrink-0"
                                    >
                                        {c('BOSS').t`Migrate`}
                                    </Button>
                                </div>
                            </Tooltip>
                        </div>
                        <ProviderUsersTable
                            users={providerUsers}
                            selected={filteredSelected}
                            setSelected={setSelectedUsers}
                            selectable={selectableUsers}
                        />
                    </Card>
                </section>
            </div>
        </div>
    );
};

export default MigrationAssistant;
