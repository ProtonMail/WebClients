import type { Address, Api } from '@proton/shared/lib/interfaces';

import type { ApiImporterOrganizationUser } from '../api/api.interface';
import {
    MAX_ADDRESSES_PER_MIGRATION_REQUEST,
    type MigrationCandidate,
    resolveMigrationCandidates,
    submitMigrations,
} from './migrationSubmission';

const IMPORTER_ORGANIZATION_ID = 'importer-organization-id';

const buildCandidates = (count: number): MigrationCandidate[] =>
    Array.from({ length: count }, (_, i) => ({
        user: { ID: `user-${i}`, Email: `user-${i}@example.com` } as ApiImporterOrganizationUser,
        address: { ID: `address-${i}`, Email: `user-${i}@example.com` } as Address,
    }));

const getRequestedAddressIds = (api: jest.Mock) => api.mock.calls.map(([config]) => config.data.AddressIds);

describe('resolveMigrationCandidates', () => {
    const buildUser = (ID: string, Email: string) => ({ ID, Email }) as ApiImporterOrganizationUser;
    const buildAddress = (ID: string, Email: string) => ({ ID, Email }) as Address;

    it('pairs users with the address matching their email, in user order', () => {
        const alice = buildUser('user-alice', 'alice@example.com');
        const bob = buildUser('user-bob', 'bob@example.com');
        const aliceAddress = buildAddress('address-alice', 'alice@example.com');
        const bobAddress = buildAddress('address-bob', 'bob@example.com');

        expect(resolveMigrationCandidates([alice, bob], [bobAddress, aliceAddress])).toEqual([
            { user: alice, address: aliceAddress },
            { user: bob, address: bobAddress },
        ]);
    });

    it('matches emails case-insensitively', () => {
        const alice = buildUser('user-alice', 'Alice@Example.com');
        const aliceAddress = buildAddress('address-alice', 'alice@example.com');

        expect(resolveMigrationCandidates([alice], [aliceAddress])).toEqual([{ user: alice, address: aliceAddress }]);
    });

    it('drops users without a matching address', () => {
        const alice = buildUser('user-alice', 'alice@example.com');
        const bob = buildUser('user-bob', 'bob@example.com');
        const aliceAddress = buildAddress('address-alice', 'alice@example.com');

        expect(resolveMigrationCandidates([alice, bob], [aliceAddress])).toEqual([
            { user: alice, address: aliceAddress },
        ]);
        expect(resolveMigrationCandidates([alice, bob], [])).toEqual([]);
    });
});

describe('submitMigrations', () => {
    it('does not call the API when there are no candidates', async () => {
        const api = jest.fn();

        const result = await submitMigrations(api as unknown as Api, IMPORTER_ORGANIZATION_ID, []);

        expect(api).not.toHaveBeenCalled();
        expect(result).toEqual({ submitted: [], failed: [] });
    });

    it('sends a single request when candidates fit within the limit', async () => {
        const api = jest.fn().mockResolvedValue({});
        const candidates = buildCandidates(MAX_ADDRESSES_PER_MIGRATION_REQUEST);

        const result = await submitMigrations(api as unknown as Api, IMPORTER_ORGANIZATION_ID, candidates);

        expect(api).toHaveBeenCalledTimes(1);
        expect(api.mock.calls[0][0]).toMatchObject({
            url: 'importer/v1/organizations/migrations',
            method: 'POST',
            data: {
                ImporterOrganizationId: IMPORTER_ORGANIZATION_ID,
                AddressIds: candidates.map(({ address }) => address.ID),
            },
        });
        expect(result.submitted).toEqual(candidates);
        expect(result.failed).toEqual([]);
    });

    it.each([
        [MAX_ADDRESSES_PER_MIGRATION_REQUEST + 1, [50, 1]],
        [120, [50, 50, 20]],
    ])('splits %i candidates into requests of %j addresses', async (count, expectedSizes) => {
        const api = jest.fn().mockResolvedValue({});
        const candidates = buildCandidates(count);

        const result = await submitMigrations(api as unknown as Api, IMPORTER_ORGANIZATION_ID, candidates);

        const requestedAddressIds = getRequestedAddressIds(api);
        expect(requestedAddressIds.map((ids) => ids.length)).toEqual(expectedSizes);
        expect(requestedAddressIds.flat()).toEqual(candidates.map(({ address }) => address.ID));
        api.mock.calls.forEach(([config]) => expect(config.data.ImporterOrganizationId).toBe(IMPORTER_ORGANIZATION_ID));
        expect(result.submitted).toEqual(candidates);
    });

    it('keeps submitting after a failed request and reports the failed candidates', async () => {
        const error = new Error('Migration already exists for some users');
        const api = jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(error).mockResolvedValueOnce({});
        const candidates = buildCandidates(120);

        const result = await submitMigrations(api as unknown as Api, IMPORTER_ORGANIZATION_ID, candidates);

        expect(api).toHaveBeenCalledTimes(3);
        expect(result.submitted).toEqual([...candidates.slice(0, 50), ...candidates.slice(100)]);
        expect(result.failed).toEqual(candidates.slice(50, 100).map((candidate) => ({ candidate, error })));
    });
});
