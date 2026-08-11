import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

interface Props {
    companyName: string;
    onConfirm: () => void;
    onClose: () => void;
}

const DeleteCompanyModal = ({ companyName, onConfirm, onClose }: Props) => {
    const [confirmation, setConfirmation] = useState('');
    const canDelete = confirmation === companyName;

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`Delete company?`} />
            <ModalTwoContent>
                <div className="flex flex-column gap-4">
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('Info')
                                .t`This permanently deletes the company **${companyName}** and everything in it. You can't undo this action.`
                        )}
                    </p>
                    <div>
                        <p className="m-0 text-bold">{c('Info').t`What happens:`}</p>
                        <ul className="m-0 pl-4">
                            <li>{c('Info').t`Members are signed out and lose access`}</li>
                            <li>{c('Info').t`All data, files, and settings are permanently deleted`}</li>
                            <li>{c('Info').t`Allocated licenses are released and won't be billed`}</li>
                            <li>{c('Info').t`Audit logs and billing history are kept for compliance`}</li>
                        </ul>
                    </div>
                    <div className="flex flex-column gap-2">
                        <p className="m-0">{c('Info').t`To confirm, enter the name of the company to delete.`}</p>
                        <InputFieldTwo value={confirmation} onValue={setConfirmation} placeholder={companyName} />
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" disabled={!canDelete} onClick={onConfirm}>
                    {c('Action').t`Delete`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteCompanyModal;
