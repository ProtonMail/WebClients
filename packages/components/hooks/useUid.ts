import generateUID from '@proton/shared/lib/helpers/generateUID';

import useInstance from './useInstance';

/* Persists same uid accross component lifetime. */
const useUid = (prefix?: string) => {
    return useInstance(() => generateUID(prefix));
};

export default useUid;
