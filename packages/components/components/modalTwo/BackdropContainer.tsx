import Backdrop from './Backdrop';
import { Portal } from '../portal';
import { useModalPositions } from './modalPositions';

const BackdropContainer = () => {
    const [modalPositions] = useModalPositions();
    return (
        <Portal>
            <Backdrop entering={modalPositions.length >= 1} exiting={modalPositions.length === 0} />
        </Portal>
    );
};

export default BackdropContainer;
