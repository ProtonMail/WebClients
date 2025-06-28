import { useMemo } from 'react';

import { resolveMessageFactory } from 'proton-pass-extension/lib/message/send-message';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const useEndpointMessage = () => {
    const { endpoint } = usePassCore();
    return useMemo(() => resolveMessageFactory(endpoint), []);
};
