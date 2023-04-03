import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, PrimaryButton } from '@proton/components';
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
                <div className="p1 flex w100">
                    <img src={keyAndFileSvg} alt={title} className="w50 mauto" />
                </div>
                <Alert className="mb1 mt1">
                    <div>{c('Info').jt`Would you like to restore your files?`}</div>
                    <div>{c('Info').jt`Recovery process might take some time.`}</div>
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex flex-justify-space-between w100 flex-nowrap">
                    <Button disabled={recovering} autoFocus className="min-w7e" onClick={onClose}>{c('Action')
                        .t`Cancel`}</Button>
                    <PrimaryButton loading={recovering} className="min-w7e" onClick={onRecovery}>
                        {c('Action').t`Start recovering`}
                    </PrimaryButton>
                </div>
            </ModalTwoFooter>
        </>
    );
};

export default FilesRecoveryState;
