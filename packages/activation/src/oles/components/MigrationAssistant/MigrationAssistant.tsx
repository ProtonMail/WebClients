import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { SkeletonLoader } from '@proton/components';
import { useDispatch } from '@proton/redux-shared-store';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import { createMigrationBatch } from '../../thunk';
import type { MigrationConfiguration } from '../../types';
import useProviderUsers from '../../useProviderUsers';
import DomainSetup from './DomainSetup';
import ProviderUsersTable from './ProviderUsersTable';

const MigrationAssistant: FC<{ config: MigrationConfiguration }> = ({ config }) => {
    const [providerUsers, providerUsersLoading] = useProviderUsers();
    const dispatch = useDispatch();

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const loading = providerUsersLoading;

    const [migrating, setMigrating] = useState<boolean>(false);
    const migratingDisabled = migrating || !selectedUsers.length || !config.domain || !getIsDomainActive(config.domain);
    const migratedCount = 0;

    if (loading) {
        return <SkeletonLoader />;
    }

    const handleMigrateUsers = async () => {
        setMigrating(true);

        const usersToImport = providerUsers.filter((u) => selectedUsers.includes(u.ID));

        await dispatch(
            createMigrationBatch({
                migrationConfig: config,
                users: usersToImport,
            })
        ).catch(noop);

        setMigrating(false);
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-custom p-4" style={{ '--max-w-custom': '60rem' }}>
                <section className="flex gap-4 mb-8">
                    {/* Users migrated */}
                    <Card rounded background={false}>
                        <span className="color-weak text-sm">{c('BOSS').t`Users migrated`}</span>
                        <div className="text-bold">{c('BOSS').t`${migratedCount} of ${providerUsers.length}`}</div>
                    </Card>

                    {/* Migration includes */}
                    <Card rounded background={false}>
                        <span className="color-weak text-sm">{c('BOSS').t`Migration includes`}</span>
                        <div className="text-bold text-capitalize">{config.selectedProducts.join(', ')}</div>
                    </Card>
                </section>

                {/* Domain setup */}
                <DomainSetup domain={config.domain} />

                {/* Migrate users */}
                <section className="mb-8">
                    <header className="flex justify-space-between items-center mb-2">
                        <div className="text-bold">{c('BOSS').t`Migrate users`}</div>
                        <Button size="small" color="norm" onClick={handleMigrateUsers} disabled={migratingDisabled}>
                            {c('BOSS').t`Migrate`}
                        </Button>
                    </header>
                    <Card rounded background={false}>
                        <ProviderUsersTable
                            users={providerUsers}
                            selected={selectedUsers}
                            setSelected={setSelectedUsers}
                        />
                    </Card>
                </section>
            </div>
        </div>
    );
};

export default MigrationAssistant;
