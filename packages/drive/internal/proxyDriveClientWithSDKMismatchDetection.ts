import type { ProtonDriveClient } from '@protontech/drive-sdk';
import { NodeType } from '@protontech/drive-sdk';
import type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';

import { traceError } from '@proton/shared/lib/helpers/sentry';

type SdkClient = ProtonDriveClient | ProtonDrivePhotosClient;

const PHOTO_NODE_TYPES: ReadonlySet<string> = new Set([NodeType.Photo, NodeType.Album]);

function isPhotoNodeType(type: string): boolean {
    return PHOTO_NODE_TYPES.has(type);
}

function reportMismatch(scope: 'drive' | 'photos', nodeType: string, method: string, nodeUid: string): void {
    const isPhoto = isPhotoNodeType(nodeType);
    const isMismatch = (scope === 'drive' && isPhoto) || (scope === 'photos' && !isPhoto);

    if (!isMismatch) {
        return;
    }

    const expectedClient = isPhoto ? 'getDriveForPhotos()' : 'getDrive()';
    const message = `[SDK scope mismatch] ${scope} client used for ${nodeType} node via ${method}`;

    const error = new Error(message);
    traceError(error, {
        tags: {
            sdkScopeMismatch: `${scope}-got-${nodeType}`,
            sdkMethod: method,
        },
        extra: {
            nodeUid,
            nodeType,
            clientScope: scope,
            expectedClient,
            currentUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
        },
    });
}

/**
 * Wraps an SDK client with a Proxy that reports to Sentry when a node
 * is accessed through the wrong client (e.g., a Photo node via the Drive client).
 *
 * This helps detect accidental client mixing at runtime.
 */
export function proxyDriveClientWithSDKMismatchDetection<T extends SdkClient>(client: T, scope: 'drive' | 'photos'): T {
    return new Proxy(client, {
        get(target, prop) {
            const value = Reflect.get(target, prop);

            if (typeof value !== 'function') {
                return value;
            }

            if (prop === 'getNode') {
                return async (...args: unknown[]) => {
                    const result = await value.apply(target, args);
                    // MaybeNode is Result<NodeEntity, DegradedNode> — ok means successful
                    if (result && typeof result === 'object' && 'ok' in result && result.ok) {
                        const node = result.value?.node ?? result.value;
                        if (node?.type) {
                            reportMismatch(scope, node.type, 'getNode', String(args[0]));
                        }
                    }
                    return result;
                };
            }

            if (prop === 'iterateNodes') {
                return async function* (...args: unknown[]) {
                    const iterator = value.apply(target, args);
                    for await (const maybeNode of iterator) {
                        if (maybeNode && typeof maybeNode === 'object' && 'ok' in maybeNode && maybeNode.ok) {
                            const node = maybeNode.value?.node ?? maybeNode.value;
                            if (node?.type) {
                                reportMismatch(scope, node.type, 'iterateNodes', node.uid ?? 'unknown');
                            }
                        }
                        yield maybeNode;
                    }
                };
            }

            return value;
        },
    });
}
