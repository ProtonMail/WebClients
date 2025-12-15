import { createAsyncThunk } from '@reduxjs/toolkit';

import type { KtState } from '@proton/account/kt';
import { getMemberAddresses, membersThunk } from '@proton/account/members';
import { createMember } from '@proton/account/members/actions';
import { organizationThunk } from '@proton/account/organization';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { createOrganizationImporterMigration } from '../api';
import type { ApiImporterOrganizationUser } from '../api/api.interface';
import type { MigrationConfiguration } from './types';

type ThunkApi = { state: KtState & OrganizationKeyState; extra: ProtonThunkArguments };

type CreateMigrationBatchParams = {
    migrationConfig: MigrationConfiguration;
    users: ApiImporterOrganizationUser[];
};
export const createMigrationBatch = createAsyncThunk<void, CreateMigrationBatchParams, ThunkApi>(
    'oles/createMigration',
    async ({ migrationConfig, users }, { dispatch, extra: { api } }) => {
        const { domain, importerOrganizationId } = migrationConfig;

        if (!domain) {
            throw 'Missing domain';
        }

        if (!importerOrganizationId) {
            throw 'Missing importer organization ID';
        }

        const [organization, members] = await Promise.all([dispatch(organizationThunk()), dispatch(membersThunk())]);
        const membersAddresses = await Promise.all(
            members.map((member) => dispatch(getMemberAddresses({ member })))
        ).then((a) => a.flat());

        const usersToCreate = users.filter((u) => !membersAddresses.find((a) => a.Email === u.Email));
        const maxAllocatableStorage = Math.floor(
            (organization!.MaxSpace - organization!.AssignedSpace) / usersToCreate.length
        );

        for (const user of usersToCreate) {
            const [Local, Domain] = getEmailParts(user.Email);

            const member = await dispatch(
                createMember({
                    api,
                    single: false,
                    member: {
                        name: user.AdminSetName,
                        addresses: [
                            {
                                Domain,
                                Local,
                            },
                        ],
                        invitationEmail: user.Email,
                        private: MEMBER_PRIVATE.READABLE,
                        password: 'random-password',
                        role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                        numAI: false,
                        lumo: false,
                        storage: Math.min(user.TotalQuota, maxAllocatableStorage),
                        mode: CreateMemberMode.Password,
                    },
                    verifiedDomains: [domain],
                    validationOptions: {
                        disableAddressValidation: false,
                        disableDomainValidation: false,
                        disableStorageValidation: false,
                    },
                })
            );

            const [address] = await dispatch(getMemberAddresses({ member }));

            membersAddresses.push(address);
        }

        const addressesToMigrate = users.map((u) => membersAddresses.find((a) => a.Email === u.Email)).filter(isTruthy);

        await api(
            createOrganizationImporterMigration({
                ImporterOrganizationId: importerOrganizationId,
                AddressIds: addressesToMigrate.map((a) => a.ID),
            })
        );
    }
);
