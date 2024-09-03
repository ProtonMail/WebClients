import generateUID from '@proton/atoms/generateUID';
import useInstance from '@proton/hooks/useInstance';

/* Persists same uid accross component lifetime. */
const useUid = (prefix?: string) => {
    return useInstance(() => generateUID(prefix));
};

export default useUid;
