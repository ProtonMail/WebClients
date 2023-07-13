import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import { Alert, ConfirmModal } from '../../components';
import { useModals } from '../../hooks';

interface Props {
    onWipe: () => Promise<void>;
    className?: string;
}

const WipeLogsButton = ({ onWipe, className }: Props) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();

    const handleConfirm = () => {
        withLoading(onWipe());
    };

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal
                title={c('Title').t`Delete logs`}
                onConfirm={handleConfirm}
                confirm={<Button color="danger" type="submit">{c('Action').t`Delete`}</Button>}
            >
                <Alert className="mb-4" type="error">{c('Info')
                    .t`Are you sure you want to permanently delete all your logs?`}</Alert>
            </ConfirmModal>
        );
    };

    return (
        <Button shape="outline" className={className} loading={loading} onClick={handleOpenModal}>{c('Action')
            .t`Wipe`}</Button>
    );
};

export default WipeLogsButton;
