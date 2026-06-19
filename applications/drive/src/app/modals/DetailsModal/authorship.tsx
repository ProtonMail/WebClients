import type { ReactNode } from 'react';

import { c } from 'ttag';

import { type NodeEntity, NodeType } from '@proton/drive';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export function getAuthorshipStatus(node: NodeEntity): {
    ok: boolean;
    message: ReactNode;
    details: string[];
} {
    const activeRevision = node.activeRevision?.ok ? node.activeRevision.value : undefined;
    const isFile = node.type === NodeType.File;

    if (node.keyAuthor.ok && node.nameAuthor.ok && !activeRevision) {
        return {
            ok: true,
            message: getAuthorshipMessage({
                isOk: true,
                isFile,
                type: 'created',
                emailAddress: node.keyAuthor.value,
            }),
            details: [],
        };
    }

    if (node.keyAuthor.ok && node.nameAuthor.ok && activeRevision?.contentAuthor?.ok) {
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

    const emailAddress = node.keyAuthor.ok ? node.keyAuthor.value : node.keyAuthor.error.claimedAuthor;
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
}): ReactNode {
    const isAnonymous = emailAddress === null;
    const author = <strong key="author">{emailAddress || c('Title').t`an anonymous user`}</strong>;

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
                ? c('Title').jt`Digital signature verified. This file was securely created by ${author}.`
                : c('Title').jt`Digital signature verified. This file was securely uploaded by ${author}.`;
        }
        return type === 'created'
            ? c('Title').jt`Digital signature verified. This folder was securely created by ${author}.`
            : c('Title').jt`Digital signature verified. This folder was securely uploaded by ${author}.`;
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
            ? c('Title').jt`We couldn’t verify that ${author} created this file.`
            : c('Title').jt`We couldn’t verify that ${author} uploaded this file.`;
    }
    return type === 'created'
        ? c('Title').jt`We couldn’t verify that ${author} created this folder.`
        : c('Title').jt`We couldn’t verify that ${author} uploaded this folder.`;
}

function getAuthorshipDetails(node: NodeEntity): string[] {
    const activeRevision = node.activeRevision?.ok ? node.activeRevision.value : undefined;

    const details = [];

    if (!node.keyAuthor.ok) {
        const claimedKeyAuthor = node.keyAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`We weren’t able to confirm that the node was created by ${claimedKeyAuthor}. The reason is: ${node.keyAuthor.error.error}`
        );
    }
    if (!node.nameAuthor.ok) {
        const claimedNameAuthor = node.nameAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`We weren’t able to confirm that the name was created or modified by ${claimedNameAuthor}. The reason is: ${node.nameAuthor.error.error}`
        );
    }
    if (activeRevision?.contentAuthor.ok === false) {
        const claimedContentAuthor =
            activeRevision.contentAuthor.error.claimedAuthor || c('Title').t`an anonymous user`;
        details.push(
            c('Title')
                .t`We weren’t able to confirm that the file content was uploaded by ${claimedContentAuthor}. The reason is: ${activeRevision.contentAuthor.error.error}`
        );
    }

    if (details.length > 0) {
        details.push(c('Title').t`This is likely due to the account or address having been deleted.`);
    }

    return details;
}
