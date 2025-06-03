import { useSelector } from '@proton/redux-shared-store/sharedProvider';

const useApiStatus = () => {
    return useSelector((state) => state.apiStatus);
};

export default useApiStatus;
