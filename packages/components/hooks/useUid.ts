import useInstance from '@proton/hooks/useInstance';
import generateUID from '@proton/utils/generateUID';

/* Persists same uid accross component lifetime. */
const useUid = (prefix?: string) => {
    return useInstance(() => generateUID(prefix));
};

export default useUid;
