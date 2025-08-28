import { c } from 'ttag';

import { type MaybeNode, NodeType } from '@proton/drive';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export function getAuthorshipStatus(node: MaybeNode): {
    ok: boolean;
    message: string;
    details: string[];
} {
    const nodeEntity = node.ok ? node.value : node.error;

    let activeRevision;
    if (node.ok) {
        activeRevision = node.value.activeRevision;
    } else {
        activeRevision = node.error.activeRevision?.ok ? node.error.activeRevision.value : undefined;
    }

    const isFile = node.ok ? node.value.type === NodeType.File : node.error.type === NodeType.File;

    if (nodeEntity.keyAuthor.ok && nodeEntity.nameAuthor.ok && !activeRevision) {
        return {
            ok: true,
            message: getAuthorshipMessage({
                isOk: true,
                isFile,
                type: 'created',
                emailAddress: nodeEntity.keyAuthor.value,
            }),
            details: [],
        };
    }

    if (nodeEntity.keyAuthor.ok && nodeEntity.nameAuthor.ok && activeRevision?.contentAuthor?.ok) {
        return {
            ok: true,
            message: getAuthorshipMessage({
                isOk: true,
                isFile,
                type: 'uploaded',
                emailAddress: activeRevision.contentAuthor.value,
            }),
            details: [],
        };
    }

    let contentEmailAddress;
    if (activeRevision) {
        contentEmailAddress = activeRevision.contentAuthor.ok
            ? activeRevision.contentAuthor.value
            : activeRevision.contentAuthor.error.claimedAuthor;
    }
    if (contentEmailAddress !== undefined) {
        return {
            ok: false,
            message: getAuthorshipMessage({ isOk: false, isFile, type: 'uploaded', emailAddress: contentEmailAddress }),
            details: getAuthorshipDetails(node),
        };
    }

    const emailAddress = nodeEntity.keyAuthor.ok
        ? nodeEntity.keyAuthor.value
        : nodeEntity.keyAuthor.error.claimedAuthor;
    return {
        ok: false,
        message: getAuthorshipMessage({ isOk: false, isFile, type: 'created', emailAddress }),
        details: getAuthorshipDetails(node),
    };
}

function getAuthorshipMessage({
    isOk,
    isFile,
    type,
    emailAddress,
}: {
    isOk: boolean;
    isFile: boolean;
    type: 'created' | 'uploaded';
    emailAddress?: string | null;
}): string {
    const isAnonymous = emailAddress === null;
    emailAddress = emailAddress || c('Title').t`an anonymous user`;

    if (isOk) {
        if (isAnonymous) {
            if (isFile) {
                return type === 'created'
                    ? c('Title')
                          .t`Digital signature partially verified. This file was created using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`
                    : c('Title')
                          .t`Digital signature partially verified. This file was uploaded using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`;
            }
            return type === 'created'
                ? c('Title')
                      .t`Digital signature partially verified. This folder was created using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`
                : c('Title')
                      .t`Digital signature partially verified. This folder was uploaded using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`;
        }
        if (isFile) {
            return type === 'created'
                ? c('Title')
                      .jt`Digital signature verified. This file was securely created by <strong>${emailAddress}</strong>.`.join(
                      ''
                  )
                : c('Title')
                      .jt`Digital signature verified. This file was securely uploaded by <strong>${emailAddress}</strong>.`.join(
                      ''
                  );
        }
        return type === 'created'
            ? c('Title')
                  .jt`Digital signature verified. This folder was securely created by <strong>${emailAddress}</strong>.`.join(
                  ''
              )
            : c('Title')
                  .jt`Digital signature verified. This folder was securely uploaded by <strong>${emailAddress}</strong>.`.join(
                  ''
              );
    }

    if (isAnonymous) {
        if (isFile) {
            return type === 'created'
                ? c('Title').t`We couldn’t verify that an anonymous user created this file.`
                : c('Title').t`We couldn’t verify that an anonymous user uploaded this file.`;
        }
        return type === 'created'
            ? c('Title').t`We couldn’t verify that an anonymous user created this folder.`
            : c('Title').t`We couldn’t verify that an anonymous user uploaded this folder.`;
    }

    if (isFile) {
        return type === 'created'
            ? c('Title').jt`We couldn’t verify that <strong>${emailAddress}</strong> created this file.`.join('')
            : c('Title').jt`We couldn’t verify that <strong>${emailAddress}</strong> uploaded this file.`.join('');
    }
    return type === 'created'
        ? c('Title').jt`We couldn’t verify that <strong>${emailAddress}</strong> created this folder.`.join('')
        : c('Title').jt`We couldn’t verify that <strong>${emailAddress}</strong> uploaded this folder.`.join('');
}

function getAuthorshipDetails(node: MaybeNode): string[] {
    const nodeEntity = node.ok ? node.value : node.error;

    let activeRevision;
    if (node.ok) {
        activeRevision = node.value.activeRevision;
    } else if (node.error.activeRevision?.ok) {
        activeRevision = node.error.activeRevision.value;
    } else {
        activeRevision = undefined;
    }

    const details = [];

    if (!nodeEntity.keyAuthor.ok) {
        const claimedKeyAuthor = nodeEntity.keyAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`The verification of the encryption keys' signature by the original creator (${claimedKeyAuthor}) who created the node failed. The reason is: ${nodeEntity.keyAuthor.error.error}`
        );
    }
    if (!nodeEntity.nameAuthor.ok) {
        const claimedNameAuthor = nodeEntity.nameAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`The verification of the name's signature by author (${claimedNameAuthor}) who set the name the last time failed. The reason is: ${nodeEntity.nameAuthor.error.error}`
        );
    }
    if (activeRevision?.contentAuthor.ok === false) {
        const claimedContentAuthor =
            activeRevision.contentAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`The verification of the file's content signature by the uploader (${claimedContentAuthor}) who uploaded the last revision failed. The reason is: ${activeRevision.contentAuthor.error.error}`
        );
    }

    return details;
}
