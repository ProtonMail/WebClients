import { useState } from 'react';

const useLoading = (initialState = true) => {
    const [loading, setLoading] = useState(initialState);
    const loaded = () => setLoading(false);
    const load = () => setLoading(true);

    return {
        loading,
        loaded,
        load
    };
};

export default useLoading;