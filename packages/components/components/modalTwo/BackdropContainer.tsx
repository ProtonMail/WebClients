import { useLayoutEffect, useState } from 'react';
import Backdrop from './Backdrop';
import { Portal } from '../portal';
import { getModalsLength, subscribe } from './useModalPosition';

const BackdropContainer = () => {
    const [modalsLength, setModalsLength] = useState(() => getModalsLength());

    useLayoutEffect(() => {
        const sync = () => {
            setModalsLength(getModalsLength());
        };
        const unsubscribe = subscribe(sync);
        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <Portal>
            <Backdrop entering={modalsLength >= 1} exiting={modalsLength === 0} />
        </Portal>
    );
};

export default BackdropContainer;
