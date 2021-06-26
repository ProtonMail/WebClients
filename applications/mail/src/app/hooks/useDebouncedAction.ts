import { useRef } from 'react';

import { debounce } from 'proton-shared/lib/helpers/function';

export const useDebouncedAction = (action: () => void, wait = 1000) => {
    return useRef(() => debounce(action, wait));
};
