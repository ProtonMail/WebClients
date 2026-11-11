import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { Author, NodeEntity } from '@proton/drive/sdk';
import { MemberRole, NodeType, RevisionState } from '@proton/drive/sdk';

import { getAuthorshipStatus } from './authorship';

function renderMessage(message: ReactNode): string {
    return renderToStaticMarkup(<>{message}</>);
}

function createSuccessfulAuthor(email: string | null): Author {
    return { ok: true, value: email };
}

function createFailedAuthor(error: string, claimedAuthor?: string): Author {
    return { ok: false, error: { claimedAuthor, error } };
}

function createNode(
    keyAuthor: Author,
    nameAuthor: Author,
    contentAuthor?: Author,
    type: NodeType = NodeType.File
): NodeEntity {
    let activeRevision: NodeEntity['activeRevision'];
    if (contentAuthor) {
        activeRevision = {
            contentAuthor,
            uid: 'mock-uid',
            state: RevisionState.Active,
            creationTime: new Date(),
            storageSize: 0,
            isImported: false,
        };
    }

    return {
        type,
        keyAuthor,
        nameAuthor,
        activeRevision,
        uid: 'mock-uid',
        name: { ok: true, value: 'mock-name' },
        directRole: MemberRole.Admin,
        isShared: false,
        isSharedByUrl: false,
        creationTime: new Date(),
        modificationTime: new Date(),
        treeEventScopeId: 'tree-event-scope-id',
        ownedBy: {},
    };
}

describe('getAuthorshipStatus', () => {
    function expectVerified(node: NodeEntity, expectedMessage: string) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(true);
        expect(renderMessage(result.message)).toContain('Digital signature verified');
        expect(renderMessage(result.message)).toContain(expectedMessage);
        expect(result.details).toEqual([]);
    }

    function expectPartiallyVerified(node: NodeEntity, expectedMessage: string) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(true);
        expect(renderMessage(result.message)).toContain('Digital signature partially verified');
        expect(renderMessage(result.message)).toContain(expectedMessage);
        expect(result.details).toEqual([]);
    }

    function expectVeirificationIssues(node: NodeEntity, expectedMessage: string, expectedDetails: string[]) {
        const result = getAuthorshipStatus(node);

        expect(result.ok).toBe(false);
        expect(renderMessage(result.message)).toContain('We couldn’t verify that');
        expect(renderMessage(result.message)).toContain(expectedMessage);
        expect(result.details).toHaveLength(expectedDetails.length + 1); // +1 for the general "this is likely ..."
        for (let i = 0; i < expectedDetails.length; i++) {
            expect(renderMessage(result.details[i])).toContain(expectedDetails[i]);
        }
    }

    describe('Success cases - all authors verified', () => {
        it('should return success for file creation when keyAuthor and nameAuthor are the same and verified, no activeRevision', () => {
            const node = createNode(
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor('user@example.com')
            );

            expectVerified(node, 'This file was securely created by <strong><bdi>user@example.com</bdi></strong>');
        });

        it('should return success for file upload when all authors are the same and verified', () => {
            const node = createNode(
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor('user@example.com'),
                NodeType.File
            );

            expectVerified(node, 'This file was securely uploaded by <strong><bdi>user@example.com</bdi></strong>');
        });

        it('should return success for folder creation when keyAuthor and nameAuthor are the same and verified', () => {
            const node = createNode(
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor('user@example.com'),
                undefined,
                NodeType.Folder
            );

            expectVerified(node, 'This folder was securely created by <strong><bdi>user@example.com</bdi></strong>');
        });

        it('should return success when key and name authors are different but both verified, no activeRevision', () => {
            const node = createNode(
                createSuccessfulAuthor('creator@example.com'),
                createSuccessfulAuthor('renamer@example.com')
            );

            expectVerified(node, 'This file was securely created by <strong><bdi>creator@example.com</bdi></strong>');
        });

        it('should return success when key and name authors are different but both verified, with uploader', () => {
            const node = createNode(
                createSuccessfulAuthor('creator@example.com'),
                createSuccessfulAuthor('renamer@example.com'),
                createSuccessfulAuthor('uploader@example.com')
            );

            expectVerified(node, 'This file was securely uploaded by <strong><bdi>uploader@example.com</bdi></strong>');
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

            expectPartiallyVerified(node, 'This file was created using a publicly accessible share link by a user');
        });

        it('should return partial verification for anonymous file upload', () => {
            const node = createNode(
                createSuccessfulAuthor(null),
                createSuccessfulAuthor(null),
                createSuccessfulAuthor(null),
                NodeType.File
            );

            expectPartiallyVerified(node, 'This file was uploaded using a publicly accessible share link by a user');
        });

        it('should return partial verification for anonymous folder creation', () => {
            const node = createNode(
                createSuccessfulAuthor(null),
                createSuccessfulAuthor(null),
                undefined,
                NodeType.Folder
            );

            expectPartiallyVerified(node, 'This folder was created using a publicly accessible share link by a user');
        });

        it('should return partial verification when one author is anonymous - key author is anonymous', () => {
            const node = createNode(
                createSuccessfulAuthor(null),
                createSuccessfulAuthor('user@example.com'),
                undefined,
                NodeType.File
            );

            expectPartiallyVerified(node, 'This file was created using a publicly accessible share link by a user');
        });

        it('should return success when one author is anonymous - name author is anonymous', () => {
            const node = createNode(
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor(null),
                undefined,
                NodeType.File
            );

            expectVerified(node, 'This file was securely created by <strong><bdi>user@example.com</bdi></strong>');
        });

        it('should return success when one author is anonymous - content author is anonymous', () => {
            const node = createNode(
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor('user@example.com'),
                createSuccessfulAuthor(null),
                NodeType.File
            );

            expectPartiallyVerified(node, 'This file was uploaded using a publicly accessible share link by a user');
        });
    });

    describe('Failure cases', () => {
        it('should return failure when all authors are the same and failing', () => {
            const node = createNode(
                createFailedAuthor('Key signature invalid', 'user@example.com'),
                createFailedAuthor('Name signature invalid', 'user@example.com'),
                createFailedAuthor('Content signature invalid', 'user@example.com')
            );

            expectVeirificationIssues(node, '<strong><bdi>user@example.com</bdi></strong> uploaded this file', [
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

            expectVeirificationIssues(node, '<strong><bdi>an anonymous user</bdi></strong> created this file', [
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

            expectVeirificationIssues(node, '<strong><bdi>uploader@example.com</bdi></strong> uploaded this file', [
                'Key signature invalid',
            ]);
        });

        it('should return failure when only nameAuthor is failing', () => {
            const node = createNode(
                createSuccessfulAuthor('creator@example.com'),
                createFailedAuthor('Name signature invalid', 'renamer@example.com'),
                createSuccessfulAuthor('uploader@example.com')
            );

            expectVeirificationIssues(node, '<strong><bdi>uploader@example.com</bdi></strong> uploaded this file', [
                'Name signature invalid',
            ]);
        });

        it('should return failure when only contentAuthor is failing', () => {
            const node = createNode(
                createSuccessfulAuthor('creator@example.com'),
                createSuccessfulAuthor('renamer@example.com'),
                createFailedAuthor('Content signature invalid', 'uploader@example.com')
            );

            expectVeirificationIssues(node, '<strong><bdi>uploader@example.com</bdi></strong> uploaded this file', [
                'Content signature invalid',
            ]);
        });
    });

    describe('Untrusted author escaping', () => {
        it('should escape HTML in a claimed author rather than rendering it as markup', () => {
            const malicious = '<img src=x onerror=alert(1)>';
            const node = createNode(
                createFailedAuthor('Key signature invalid', malicious),
                createFailedAuthor('Name signature invalid', malicious),
                createFailedAuthor('Content signature invalid', malicious)
            );

            const rendered = renderMessage(getAuthorshipStatus(node).message);

            expect(rendered).not.toContain('<img');
            expect(rendered).toContain('&lt;img src=x onerror=alert(1)&gt;');
        });
    });

    describe('Bidi isolation of authors', () => {
        it('should isolate claimed authors with bidi overrides from the surrounding sentence', () => {
            const claimedAuthor = '\u202Eattacker@example.com';
            const node = createNode(
                createFailedAuthor('Key signature invalid', claimedAuthor),
                createFailedAuthor('Name signature invalid', claimedAuthor),
                createFailedAuthor('Content signature invalid', claimedAuthor)
            );

            const status = getAuthorshipStatus(node);

            expect(renderMessage(status.message)).toBe(
                `We couldn’t verify that <strong><bdi>${claimedAuthor}</bdi></strong> uploaded this file.`
            );
            expect(status.details.slice(0, 3).map(renderMessage)).toEqual([
                `We weren’t able to confirm that the node was created by <bdi>${claimedAuthor}</bdi>. The reason is: Key signature invalid`,
                `We weren’t able to confirm that the name was created or modified by <bdi>${claimedAuthor}</bdi>. The reason is: Name signature invalid`,
                `We weren’t able to confirm that the file content was uploaded by <bdi>${claimedAuthor}</bdi>. The reason is: Content signature invalid`,
            ]);
        });
    });
});
