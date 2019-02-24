import { useState } from 'react';

const useLoading = (initialState = true) => {
    const [loading, setLoading] = useState(initialState);
    const loaded = () => setLoading(false);

    return {
        loading,
        loaded
    };
};

export default useLoading;