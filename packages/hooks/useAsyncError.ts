import { useEffect, useState } from 'react';

/**
 * Custom hook that allows throwing an error asynchronously.
 * Source: https://medium.com/trabe/catching-asynchronous-errors-in-react-using-error-boundaries-5e8a5fd7b971
 * @returns {function} throwError - A function that can be called to throw an error.
 */
const useAsyncError = () => {
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return setError;
};

export default useAsyncError;
