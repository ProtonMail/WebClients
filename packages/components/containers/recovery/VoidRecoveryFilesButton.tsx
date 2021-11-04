import { c } from 'ttag';
import { useEventManager, useModals } from '../../hooks';
import Button, { ButtonProps } from '../../components/button/Button';
import VoidRecoveryFilesModal from './VoidRecoveryFilesModal';

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {}

const VoidRecoveryFilesButton = ({ loading, ...rest }: Props) => {
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleClick = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(<VoidRecoveryFilesModal onClose={reject} onSuccess={resolve} />);
        });
        await call();
    };

    return (
        <Button onClick={handleClick} loading={loading} {...rest}>
            {c('Action').t`Void all recovery files`}
        </Button>
    );
};

export default VoidRecoveryFilesButton;
