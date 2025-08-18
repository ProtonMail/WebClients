import type { Result } from '@protontech/drive-sdk';
import { RevisionState } from '@protontech/drive-sdk';

import type { Author, MaybeNode, Revision } from '@proton/drive';
import { MemberRole, NodeType } from '@proton/drive';

import { getAuthorshipStatus } from './authorship';

function createSuccessfulAuthor(email: string | null): Author {
    return { ok: true, value: email };
}

function createFailedAuthor(error: string, claimedAuthor?: string): Author {
    return { ok: false, error: { claimedAuthor, error } };
}

function createOkNode(
    keyAuthor: Author,
    nameAuthor: Author,
    contentAuthor?: Author,
    type: NodeType = NodeType.File
): MaybeNode {
    return {
        ok: true,
        value: {
            type,
            keyAuthor,
            nameAuthor,
            activeRevision: contentAuthor
                ? {
                      contentAuthor,
                      // Mocked required properties
                      uid: 'mock-uid',
                      state: RevisionState.Active,
                      creationTime: new Date(),
                      storageSize: 0,
                  }
                : undefined,
            // Mocked required properties
            uid: 'mock-uid',
            name: 'mock-name',
            directRole: MemberRole.Admin,
            isShared: false,
            creationTime: new Date(),
            treeEventScopeId: 'tree-event-scope-id',
        },
    };
}

function createDegradedNode(
    keyAuthor: Author,
    nameAuthor: Author,
    contentAuthor?: Author | Error, // Error means the revision results in an error.
    type: NodeType = NodeType.File
): MaybeNode {
    let activeRevision: Result<Revision, Error> | undefined;
    if (contentAuthor) {
        if (contentAuthor instanceof Error) {
            activeRevision = { ok: false, error: contentAuthor };
        } else {
            activeRevision = {
                ok: true,
                value: {
                    contentAuthor,
                    // Mocked required properties
                    uid: 'mock-uid',
                    state: RevisionState.Active,
                    creationTime: new Date(),
                    storageSize: 0,
                },
            };
        }
    }

    return {
        ok: false,
        error: {
            type,
            keyAuthor,
            nameAuthor,
            activeRevision,
            // Mocked required properties
            uid: 'mock-uid',
            name: { ok: true, value: 'mock-name' },
            directRole: MemberRole.Admin,
            isShared: false,
            creationTime: new Date(),
            treeEventScopeId: 'tree-event-scope-id',
        },
    };
}

describe('getAuthorshipStatus', () => {
    function expectVerified(node: MaybeNode, expectedMessage: string) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(true);
        expect(result.message).toContain('Digital signature verified');
        expect(result.message).toContain(expectedMessage);
        expect(result.details).toEqual([]);
    }

    function expectPartiallyVerified(node: MaybeNode, expectedMessage: string) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(true);
        expect(result.message).toContain('Digital signature partially verified');
        expect(result.message).toContain(expectedMessage);
        expect(result.details).toEqual([]);
    }

    function expectVeirificationIssues(node: MaybeNode, expectedMessage: string, expectedDetails: string[]) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(false);
        expect(result.message).toContain('We couldn’t verify that');
        expect(result.message).toContain(expectedMessage);
        expect(result.details).toHaveLength(expectedDetails.length);
        for (let i = 0; i < expectedDetails.length; i++) {
            expect(result.details[i]).toContain(expectedDetails[i]);
        }
    }

    for (const createNode of [createOkNode, createDegradedNode]) {
        describe('Node type: ' + createNode.name, () => {
            describe('Success cases - all authors verified', () => {
                it('should return success for file creation when keyAuthor and nameAuthor are the same and verified, no activeRevision', () => {
                    const node = createNode(
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor('user@example.com')
                    );

                    expectVerified(node, 'This file was securely created by <strong>user@example.com</strong>');
                });

                it('should return success for file upload when all authors are the same and verified', () => {
                    const node = createNode(
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor('user@example.com'),
                        NodeType.File
                    );

                    expectVerified(node, 'This file was securely uploaded by <strong>user@example.com</strong>');
                });

                it('should return success for folder creation when keyAuthor and nameAuthor are the same and verified', () => {
                    const node = createNode(
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor('user@example.com'),
                        undefined,
                        NodeType.Folder
                    );

                    expectVerified(node, 'This folder was securely created by <strong>user@example.com</strong>');
                });

                it('should return success when key and name authors are different but both verified, no activeRevision', () => {
                    const node = createNode(
                        createSuccessfulAuthor('creator@example.com'),
                        createSuccessfulAuthor('renamer@example.com')
                    );

                    expectVerified(node, 'This file was securely created by <strong>creator@example.com</strong>');
                });

                it('should return success when key and name authors are different but both verified, no activeRevision', () => {
                    const node = createNode(
                        createSuccessfulAuthor('creator@example.com'),
                        createSuccessfulAuthor('renamer@example.com'),
                        createSuccessfulAuthor('uploader@example.com')
                    );

                    expectVerified(node, 'This file was securely uploaded by <strong>uploader@example.com</strong>');
                });
            });

            describe('Success cases - anonymous users', () => {
                it('should return partial verification for anonymous file creation, no activeRevision', () => {
                    const node = createNode(
                        createSuccessfulAuthor(null),
                        createSuccessfulAuthor(null),
                        undefined,
                        NodeType.File
                    );

                    expectPartiallyVerified(
                        node,
                        'This file was created using a publicly accessible share link by a user'
                    );
                });

                it('should return partial verification for anonymous file upload', () => {
                    const node = createNode(
                        createSuccessfulAuthor(null),
                        createSuccessfulAuthor(null),
                        createSuccessfulAuthor(null),
                        NodeType.File
                    );

                    expectPartiallyVerified(
                        node,
                        'This file was uploaded using a publicly accessible share link by a user'
                    );
                });

                it('should return partial verification for anonymous folder creation', () => {
                    const node = createNode(
                        createSuccessfulAuthor(null),
                        createSuccessfulAuthor(null),
                        undefined,
                        NodeType.Folder
                    );

                    expectPartiallyVerified(
                        node,
                        'This folder was created using a publicly accessible share link by a user'
                    );
                });

                it('should return partial verification when one author is anonymous - key author is anonymous', () => {
                    const node = createNode(
                        createSuccessfulAuthor(null),
                        createSuccessfulAuthor('user@example.com'),
                        undefined,
                        NodeType.File
                    );

                    expectPartiallyVerified(
                        node,
                        'This file was created using a publicly accessible share link by a user'
                    );
                });

                it('should return success when one author is anonymous - name author is anonymous', () => {
                    const node = createNode(
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor(null),
                        undefined,
                        NodeType.File
                    );

                    expectVerified(node, 'This file was securely created by <strong>user@example.com</strong>');
                });

                it('should return success when one author is anonymous - content author is anonymous', () => {
                    const node = createNode(
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor('user@example.com'),
                        createSuccessfulAuthor(null),
                        NodeType.File
                    );

                    expectPartiallyVerified(
                        node,
                        'This file was uploaded using a publicly accessible share link by a user'
                    );
                });
            });

            describe('Failure cases', () => {
                it('should return failure when all authors are the same and failing', () => {
                    const node = createNode(
                        createFailedAuthor('Key signature invalid', 'user@example.com'),
                        createFailedAuthor('Name signature invalid', 'user@example.com'),
                        createFailedAuthor('Content signature invalid', 'user@example.com')
                    );

                    expectVeirificationIssues(node, '<strong>user@example.com</strong> uploaded this file', [
                        'Key signature invalid',
                        'Name signature invalid',
                        'Content signature invalid',
                    ]);
                });

                it('should return failure when all authors are anonymous and failing', () => {
                    const node = createNode(
                        createFailedAuthor('Key signature invalid'),
                        createFailedAuthor('Name signature invalid'),
                        createFailedAuthor('Content signature invalid')
                    );

                    expectVeirificationIssues(node, '<strong>an anonymous user</strong> created this file', [
                        'Key signature invalid',
                        'Name signature invalid',
                        'Content signature invalid',
                    ]);
                });

                it('should return failure when only keyAuthor is failing', () => {
                    const node = createNode(
                        createFailedAuthor('Key signature invalid', 'creator@example.com'),
                        createSuccessfulAuthor('renamer@example.com'),
                        createSuccessfulAuthor('uploader@example.com')
                    );

                    expectVeirificationIssues(node, '<strong>uploader@example.com</strong> uploaded this file', [
                        'Key signature invalid',
                    ]);
                });

                it('should return failure when only nameAuthor is failing', () => {
                    const node = createNode(
                        createSuccessfulAuthor('creator@example.com'),
                        createFailedAuthor('Name signature invalid', 'renamer@example.com'),
                        createSuccessfulAuthor('uploader@example.com')
                    );

                    expectVeirificationIssues(node, '<strong>uploader@example.com</strong> uploaded this file', [
                        'Name signature invalid',
                    ]);
                });

                it('should return failure when only contentAuthor is failing', () => {
                    const node = createNode(
                        createSuccessfulAuthor('creator@example.com'),
                        createSuccessfulAuthor('renamer@example.com'),
                        createFailedAuthor('Content signature invalid', 'uploader@example.com')
                    );

                    expectVeirificationIssues(node, '<strong>uploader@example.com</strong> uploaded this file', [
                        'Content signature invalid',
                    ]);
                });
            });
        });
    }
});
