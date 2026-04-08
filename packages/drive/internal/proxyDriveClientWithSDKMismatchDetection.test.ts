import { NodeType } from '@protontech/drive-sdk';

import { traceError } from '@proton/shared/lib/helpers/sentry';

import { proxyDriveClientWithSDKMismatchDetection } from './proxyDriveClientWithSDKMismatchDetection';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
}));

const mockedTraceError = jest.mocked(traceError);

const node = (type: NodeType, uid: string) => ({ ok: true, value: { node: { type, uid } } });
const degradedNode = (uid: string) => ({ ok: false, error: { uid } });

function fakeClient(overrides: Record<string, jest.Mock> = {}) {
    return { getNode: jest.fn(), iterateNodes: jest.fn(), someOtherMethod: jest.fn(), ...overrides } as any;
}

function asyncIterable<T>(items: T[]) {
    return (async function* () {
        for (const item of items) {
            yield item;
        }
    })();
}

describe('proxyDriveClientWithSDKMismatchDetection', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('reports mismatches', () => {
        it.each([
            { scope: 'drive' as const, type: NodeType.Photo, tag: 'drive-got-photo' },
            { scope: 'drive' as const, type: NodeType.Album, tag: 'drive-got-album' },
            { scope: 'photos' as const, type: NodeType.File, tag: 'photos-got-file' },
            { scope: 'photos' as const, type: NodeType.Folder, tag: 'photos-got-folder' },
        ])('$scope client + $type node → $tag', async ({ scope, type, tag }) => {
            const uid = `${type}-1`;
            const client = fakeClient({ getNode: jest.fn().mockResolvedValue(node(type, uid)) });
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, scope);

            const result = await proxied.getNode(uid);

            expect(result).toBe(await client.getNode.mock.results[0].value);
            const expectedClient =
                type === NodeType.Photo || type === NodeType.Album ? 'getDriveForPhotos()' : 'getDrive()';
            expect(mockedTraceError).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining(`${scope} client used for ${type} node`) }),
                expect.objectContaining({
                    tags: expect.objectContaining({ sdkScopeMismatch: tag, sdkMethod: 'getNode' }),
                    extra: expect.objectContaining({
                        nodeUid: uid,
                        nodeType: type,
                        clientScope: scope,
                        expectedClient,
                    }),
                })
            );
        });
    });

    describe('does not report correct usage', () => {
        it.each([
            { scope: 'drive' as const, type: NodeType.File },
            { scope: 'drive' as const, type: NodeType.Folder },
            { scope: 'photos' as const, type: NodeType.Photo },
            { scope: 'photos' as const, type: NodeType.Album },
        ])('$scope client + $type node → no report', async ({ scope, type }) => {
            const client = fakeClient({ getNode: jest.fn().mockResolvedValue(node(type, 'uid-1')) });
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, scope);

            await proxied.getNode('uid-1');

            expect(mockedTraceError).not.toHaveBeenCalled();
        });

        it('ignores degraded nodes', async () => {
            const client = fakeClient({ getNode: jest.fn().mockResolvedValue(degradedNode('bad-1')) });
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, 'drive');

            await proxied.getNode('bad-1');

            expect(mockedTraceError).not.toHaveBeenCalled();
        });
    });

    describe('iterateNodes', () => {
        it('reports only mismatched nodes and yields all', async () => {
            const items = [node(NodeType.Photo, 'p-1'), node(NodeType.File, 'f-1')];
            const client = fakeClient({ iterateNodes: jest.fn().mockReturnValue(asyncIterable(items)) });
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, 'drive');

            const results = [];
            for await (const n of proxied.iterateNodes(['p-1', 'f-1'])) {
                results.push(n);
            }

            expect(results).toEqual(items);
            expect(mockedTraceError).toHaveBeenCalledTimes(1);
            expect(mockedTraceError).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('photo node') }),
                expect.any(Object)
            );
        });
    });

    describe('passthrough', () => {
        it('does not intercept other methods', () => {
            const client = fakeClient({ someOtherMethod: jest.fn().mockReturnValue('hello') });
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, 'drive');

            expect(proxied.someOtherMethod()).toBe('hello');
            expect(mockedTraceError).not.toHaveBeenCalled();
        });

        it('passes through non-function properties', () => {
            const client = { version: '1.0' } as any;
            const proxied = proxyDriveClientWithSDKMismatchDetection(client, 'drive');

            expect(proxied.version).toBe('1.0');
        });
    });
});
