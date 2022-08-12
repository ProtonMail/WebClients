import { useContext } from 'react';

import ModalsContainer from './Container';
import ModalsChildrenContext from './childrenContext';
import ModalsContext from './modalsContext';

const ModalsChildren = () => {
    const manager = useContext(ModalsContext);
    const children = useContext(ModalsChildrenContext);

    return <ModalsContainer removeModal={manager.removeModal} hideModal={manager.hideModal} modals={children} />;
};

export default ModalsChildren;
