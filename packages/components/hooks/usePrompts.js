import { useContext } from 'react';
import PromptsContext from '../context/prompts';

const useNotifications = () => {
    return useContext(PromptsContext);
};

export default useNotifications;
