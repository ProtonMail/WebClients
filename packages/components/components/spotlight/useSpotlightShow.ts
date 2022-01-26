import { useContext, useEffect } from 'react';
import { useInstance } from '../..';

import { generateUID } from '../../helpers';
import { SpotlightContext } from './Provider';

const useSpotlightShow = (show: boolean) => {
    const uid = useInstance(() => generateUID());

    const { spotlight, addSpotlight } = useContext(SpotlightContext);

    useEffect(() => {
        if (show) {
            addSpotlight(uid);
        }
    }, [show]);

    return spotlight === uid && show;
};

export default useSpotlightShow;
