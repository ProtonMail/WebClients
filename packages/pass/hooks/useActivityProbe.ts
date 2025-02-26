import { useEffect, useRef } from 'react';

import type { ActivityProbe } from '@proton/pass/utils/time/probe';
import { createActivityProbe } from '@proton/pass/utils/time/probe';

export const useActivityProbe = (): ActivityProbe => {
    const probe = useRef(createActivityProbe()).current;
    useEffect(() => () => probe.cancel(), []);
    return probe;
};
