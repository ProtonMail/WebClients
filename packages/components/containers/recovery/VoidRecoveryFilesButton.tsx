import { c } from 'ttag';
import { useEventManager } from '../../hooks';
import Button, { ButtonProps } from '../../components/button/Button';
import VoidRecoveryFilesModal from './VoidRecoveryFilesModal';
import { useModalState } from '../../components';

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {}

const VoidRecoveryFilesButton = ({ loading, ...rest }: Props) => {
    const { call } = useEventManager();
    const [voidRecoveryFilesModal, setVoidRecoveryFilesModalOpen, renderVoidRecoveryFilesModal] = useModalState();

    return (
        <>
            {renderVoidRecoveryFilesModal && (
                <VoidRecoveryFilesModal
                    {...voidRecoveryFilesModal}
                    onSuccess={async () => {
                        await call();
                    }}
                />
            )}
            <Button onClick={() => setVoidRecoveryFilesModalOpen(true)} loading={loading} {...rest}>
                {c('Action').t`Void all recovery files`}
            </Button>
        </>
    );
};

export default VoidRecoveryFilesButton;
