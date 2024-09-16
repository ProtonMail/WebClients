import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';

import { ConfirmModal } from '../../components';
import { useModals } from '../../hooks';

interface Props {
    onWipe: () => Promise<void>;
    className?: string;
    loading?: boolean;
}

const WipeLogsButton = ({ onWipe, className, loading }: Props) => {
    const { createModal } = useModals();

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal
                title={c('Title').t`Delete logs`}
                onConfirm={onWipe}
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
