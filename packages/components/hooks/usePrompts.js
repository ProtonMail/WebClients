import { useContext } from 'react';
import PromptsContext from '../context/prompts';

const usePrompts = () => {
    return useContext(PromptsContext);
};

export default usePrompts;
