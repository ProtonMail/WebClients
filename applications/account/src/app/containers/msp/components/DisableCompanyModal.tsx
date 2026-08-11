import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

interface Props {
    onConfirm: () => void;
    onClose: () => void;
}

const DisableCompanyModal = ({ onConfirm, onClose }: Props) => {
    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`Disable company`} />
            <ModalTwoContent>
                <div className="flex flex-column gap-4">
                    <p className="m-0">{c('Info').t`The company and all its members will lose access immediately.`}</p>
                    <div>
                        <p className="m-0 text-bold">{c('Info').t`What happens:`}</p>
                        <ul className="m-0 pl-4">
                            <li>{c('Info').t`Members are signed out and can't sign back in`}</li>
                            <li>{c('Info').t`All data and settings are preserved`}</li>
                            <li>{c('Info').t`Allocated licenses won't be billed while disabled`}</li>
                        </ul>
                    </div>
                    <p className="m-0">{c('Info').t`You can enable this company again at any time.`}</p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" onClick={onConfirm}>
                    {c('Action').t`Disable`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisableCompanyModal;
