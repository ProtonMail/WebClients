import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

import { ConfirmModal, Alert, useSettingsLink } from '../../components';

interface Props {
    onConfirm?: () => void;
    onClose?: () => void;
}

const UpgradeModal = ({ onConfirm = noop, onClose = noop, ...rest }: Props) => {
    const goToSettings = useSettingsLink();
    return (
        <ConfirmModal
            title={c('Title').t`Upgrade required`}
            onConfirm={() => {
                goToSettings('/dashboard');
                onConfirm();
            }}
            onClose={onClose}
            confirm={c('Action').t`Upgrade`}
            {...rest}
        >
            <Alert className="mb1" type="warning">{c('Warning').t`This feature requires a paid Proton account`}</Alert>
        </ConfirmModal>
    );
};

export default UpgradeModal;
