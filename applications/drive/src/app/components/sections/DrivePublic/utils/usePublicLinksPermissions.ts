import { type DecryptedLink, usePublicSessionUser } from '../../../../store';
import { useAnonymousUploadAuthStore } from '../../../../zustand/upload/anonymous-auth.store';

export const usePublicLinksPermissions = (linksInput: DecryptedLink | DecryptedLink[]) => {
    const { hasUploadToken } = useAnonymousUploadAuthStore();
    const { userAddressEmail } = usePublicSessionUser();

    const links = Array.isArray(linksInput) ? linksInput : [linksInput];

    const everyLinkHaveToken = links.every((link) => hasUploadToken(link.linkId));

    if (!links.length) {
        return {
            canRename: false,
            canDelete: false,
        };
    }
    const isLastEditor =
        userAddressEmail &&
        links.every((link) => {
            const signatureEmail = link.isFile ? link.activeRevision?.signatureEmail : link.signatureEmail;
            return signatureEmail === userAddressEmail;
        });

    const isCreator =
        userAddressEmail &&
        links.every((link) => {
            return link.signatureEmail === userAddressEmail;
        });

    const canDelete = userAddressEmail ? isCreator && isLastEditor : everyLinkHaveToken;

    const canRename = userAddressEmail ? isLastEditor : everyLinkHaveToken;

    return {
        canRename,
        canDelete,
    };
};
