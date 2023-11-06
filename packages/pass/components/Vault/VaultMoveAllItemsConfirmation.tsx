import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import type { ConfirmationModalProps } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { selectShare } from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';

type Props = {
    destinationShareId: MaybeNull<string>;
    onSubmit: () => void;
} & Pick<ConfirmationModalProps, 'onClose' | 'open'>;

export const VaultMoveAllItemsConfirmation: VFC<Props> = ({ destinationShareId, open, onClose, onSubmit }) => {
    const destinationVault = useSelector(selectShare<ShareType.Vault>(destinationShareId));

    return (
        <ConfirmationModal
            title={
                // translator: variable here is the name of the vault: Move all items to "Work"?
                c('Title').t`Move all items to "${destinationVault?.content.name}"?`
            }
            open={open}
            onClose={onClose}
            onSubmit={onSubmit}
            submitText={c('Action').t`Move all items`}
        ></ConfirmationModal>
    );
};
