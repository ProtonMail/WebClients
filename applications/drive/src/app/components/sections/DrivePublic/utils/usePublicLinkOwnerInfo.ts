import { type DecryptedLink, usePublicSessionUser } from '../../../../store';

export const usePublicLinkOwnerInfo = (linksInput: DecryptedLink | DecryptedLink[]) => {
    const { userAddressEmail } = usePublicSessionUser();

    const links = Array.isArray(linksInput) ? linksInput : [linksInput];

    if (!userAddressEmail || !links.length) {
        return {
            loggedIn: false,
            isCreator: false,
            isLastEditor: false,
        };
    }

    const isLastEditor = links.every((link) => {
        const signatureAddress = link.isFile ? link.activeRevision?.signatureAddress : link.signatureAddress;
        return signatureAddress === userAddressEmail;
    });

    const isCreator = links.every((link) => {
        return link.signatureAddress === userAddressEmail;
    });

    return {
        loggedIn: true,
        isCreator,
        isLastEditor,
    };
};
