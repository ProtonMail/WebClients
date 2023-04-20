import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { AliasState } from '@proton/pass/store';
import { WorkerMessageType } from '@proton/pass/types';

export const createAliasService = () => {
    const getOptions = async (): Promise<AliasState['aliasOptions']> =>
        sendMessage.map(
            contentScriptMessage({
                type: WorkerMessageType.ALIAS_OPTIONS,
            }),
            (response) => (response.type === 'success' ? response.options : null)
        );

    return {
        getOptions,
    };
};
