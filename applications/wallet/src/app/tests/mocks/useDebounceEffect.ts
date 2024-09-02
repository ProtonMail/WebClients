import { useEffect } from 'react';

import noop from 'lodash/noop';

import * as useDebounceEffectModule from '../../utils/hooks/useDebouncedEffect';

export const mockUseDebounceEffect = (removeEffect: boolean = false) => {
    const spy = vi.spyOn(useDebounceEffectModule, 'useDebounceEffect');

    spy.mockImplementation((effect, deps) => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return removeEffect ? noop() : useEffect(effect, deps);
    });

    return spy;
};
