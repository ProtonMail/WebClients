import { useContext } from 'react';
import ModalsContext from './modalsContext';
import ModalsChildrenContext from './childrenContext';
import ModalsContainer from './Container';

const ModalsChildren = () => {
    const manager = useContext(ModalsContext);
    const children = useContext(ModalsChildrenContext);

    return <ModalsContainer removeModal={manager.removeModal} hideModal={manager.hideModal} modals={children} />;
};

export default ModalsChildren;
