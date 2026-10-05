import type { Address, Api } from '@proton/shared/lib/interfaces';
import chunk from '@proton/utils/chunk';
import isTruthy from '@proton/utils/isTruthy';

import { createOrganizationImporterMigration } from '../api';
import type { ApiImporterOrganizationUser } from '../api/api.interface';
import { areEquivalentEmails } from './helpers';

/**
 * Upper bound on `AddressIds` accepted by a single migration request.
 * Mirrors the `Assert\Count(max: 50)` constraint in `CreateImporterOrganizationUsersRequest`.
 */
export const MAX_ADDRESSES_PER_MIGRATION_REQUEST = 50;

export type MigrationCandidate = {
    user: ApiImporterOrganizationUser;
    address: Address;
};

export type MigrationSubmissionResult = {
    submitted: MigrationCandidate[];
    failed: { candidate: MigrationCandidate; error: unknown }[];
};

/**
 * Pairs each user with the known address matching their email. Users without a matching address are dropped.
 */
export const resolveMigrationCandidates = (
    users: ApiImporterOrganizationUser[],
    knownAddresses: Address[]
): MigrationCandidate[] =>
    users
        .map((user): MigrationCandidate | undefined => {
            const address = knownAddresses.find((a) => areEquivalentEmails(a.Email, user.Email));
            return address ? { user, address } : undefined;
        })
        .filter(isTruthy);

/**
 * Submits migrations for the given candidates, splitting them into requests the API accepts.
 * Chunks are sent sequentially and a failing chunk does not prevent the remaining ones from being
 * submitted; its candidates are reported in `failed` along with the error.
 */
export const submitMigrations = async (
    api: Api,
    importerOrganizationId: string,
    candidates: MigrationCandidate[]
): Promise<MigrationSubmissionResult> => {
    const result: MigrationSubmissionResult = { submitted: [], failed: [] };

    for (const batch of chunk(candidates, MAX_ADDRESSES_PER_MIGRATION_REQUEST)) {
        try {
            await api(
                createOrganizationImporterMigration({
                    ImporterOrganizationId: importerOrganizationId,
                    AddressIds: batch.map(({ address }) => address.ID),
                })
            );
            result.submitted.push(...batch);
        } catch (error) {
            result.failed.push(...batch.map((candidate) => ({ candidate, error })));
        }
    }

    return result;
};
