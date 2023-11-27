import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useExtensionActivityProbe = () => {
    const { endpoint } = usePassCore();
    return useActivityProbe(() =>
        sendMessage(
            resolveMessageFactory(endpoint)({
                type: WorkerMessageType.ACTIVITY_PROBE,
            })
        ).catch(noop)
    );
};
