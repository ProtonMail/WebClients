import { useContext } from 'react';
import ContextSrp from '../context/srp';

const useSrp = () => {
    return useContext(ContextSrp);
};

export default useSrp;
