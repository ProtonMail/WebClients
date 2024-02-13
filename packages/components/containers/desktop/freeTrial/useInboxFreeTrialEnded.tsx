import { useEffect, useState } from 'react';

import { END_OF_TRIAL_KEY } from '@proton/shared/lib/desktop/desktopTypes';
import { getItem } from '@proton/shared/lib/helpers/storage';

// TODO do stuff
const useInboxFreeTrialEnded = () => {
    const [hasTrialEnded, setHasTrialEnded] = useState(false);

    useEffect(() => {
        const item = !!getItem(END_OF_TRIAL_KEY);
        setHasTrialEnded(item);
    }, []);

    return {
        hasTrialEnded,
    };
};

export default useInboxFreeTrialEnded;
