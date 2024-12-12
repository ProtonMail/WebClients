import { c } from 'ttag';

import { type useConfirmActionModal } from '@proton/components/index';

import usePublicToken from '../../../../hooks/drive/usePublicToken';
import { type DecryptedLink, usePublicActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface DecryptedLinkWithToken extends DecryptedLink {
    authorizationToken?: string;
}

interface Props {
    selectedLinks: DecryptedLinkWithToken[];
    anonymousRemoval?: boolean;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    close: () => void;
}

export const DeleteButton = ({ close, selectedLinks, anonymousRemoval = false, showConfirmModal }: Props) => {
    const { token } = usePublicToken();
    const { deleteLinks } = usePublicActions();
    return (
        <ContextMenuButton
            name={c('Action').t`Delete`}
            icon="trash"
            testId="context-menu-delete"
            action={() =>
                deleteLinks(new AbortController().signal, {
                    token,
                    links: selectedLinks,
                    showConfirmModal,
                    anonymousRemoval,
                })
            }
            close={close}
        />
    );
};
