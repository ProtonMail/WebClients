import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import type { Group } from '@proton/shared/lib/interfaces';

import GroupItemActionPrompt from './GroupItemActionPrompt';

interface Props {
    group: Group;
    showMailFeatures: boolean;
    onConfirm: () => Promise<void>;
    modalProps: ModalStateProps;
}

const DeleteGroupPrompt = ({ group, showMailFeatures, onConfirm, modalProps }: Props) => {
    const displayGroupName = (
        <strong key="group-name" className="text-break">
            {group.Name}
        </strong>
    );

    const displayGroupAddressEmail = (
        <strong key="group-email" className="text-break">
            {group.Address.Email}
        </strong>
    );

    return (
        <GroupItemActionPrompt
            title={c('Title').t`Delete group?`}
            buttonTitle={c('Action').t`Delete group`}
            children={
                <>
                    {showMailFeatures
                        ? c('Delete group prompt with email')
                              .jt`Please note that if you delete the group ${displayGroupName} (with address ${displayGroupAddressEmail}), you will no longer be able to receive emails using its address.`
                        : c('Delete group prompt')
                              .jt`Please note that if you delete the group ${displayGroupName}, it will be permanently removed.`}
                    <br />
                    <br />
                    {c('Delete group prompt').t`Are you sure you want to delete this group?`}
                </>
            }
            onConfirm={onConfirm}
            {...modalProps}
        />
    );
};

export default DeleteGroupPrompt;
