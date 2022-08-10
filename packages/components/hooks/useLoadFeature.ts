import { useContext } from 'react';

import { FeaturesLoadContext } from '../containers/features';

const useLoadFeature = () => {
    return useContext(FeaturesLoadContext);
};

export default useLoadFeature;
