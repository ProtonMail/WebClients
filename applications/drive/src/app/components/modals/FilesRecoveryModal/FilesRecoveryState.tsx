import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import keyAndFileSvg from '@proton/styles/assets/img/illustrations/file-recovery.svg';

interface Props {
    onRecovery: () => void;
    onClose?: () => void;
    recovering?: boolean;
}

const FilesRecoveryState = ({ onRecovery, onClose, recovering }: Props) => {
    const title = c('Title').t`Restore your files`;

    return (
        <>
            <ModalTwoHeader title={c('Title').t`File recovery process`} closeButtonProps={{ disabled: recovering }} />
            <ModalTwoContent>
                <div className="p-4 flex w-full">
                    <img src={keyAndFileSvg} alt={title} className="w-1/2 m-auto" />
                </div>
                <Alert className="my-4">
                    <div>{c('Info').jt`Would you like to restore your files?`}</div>
                    <div>{c('Info').jt`Recovery process might take some time.`}</div>
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex justify-space-between w-full flex-nowrap">
                    <Button
                        disabled={recovering}
                        autoFocus
                        className="min-w-custom"
                        style={{ '--min-w-custom': '7em' }}
                        onClick={onClose}
                    >{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        loading={recovering}
                        className="min-w-custom"
                        style={{ '--min-w-custom': '7em' }}
                        onClick={onRecovery}
                    >
                        {c('Action').t`Start recovering`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </>
    );
};

export default FilesRecoveryState;
