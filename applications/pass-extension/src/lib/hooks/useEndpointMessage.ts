import { useMemo } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

import { resolveMessageFactory } from '../message/send-message';

export const useEndpointMessage = () => {
    const { endpoint } = usePassCore();
    return useMemo(() => resolveMessageFactory(endpoint), []);
};
