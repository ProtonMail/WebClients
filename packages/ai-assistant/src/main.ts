import { downloadModel } from '@proton/llm/lib/downloader';
import { isAssistantPostMessage, postMessageToAssistantParent } from '@proton/llm/lib/helpers';
import { ASSISTANT_EVENTS, AssistantConfig } from '@proton/llm/lib/types';

window.addEventListener('load', async () => {
    let abortController: AbortController | undefined; // defined if status === 'loading'
    let parentURL: string;

    const handleDownloadModel = async (
        assistantConfig: AssistantConfig,
        modelVariant: string,
        filesToIgnore: string[]
    ) => {
        try {
            if (!abortController) {
                abortController = new AbortController();
                await downloadModel(modelVariant, assistantConfig, abortController, filesToIgnore, parentURL);
                abortController = undefined;
            }
        } catch (error: any) {
            postMessageToAssistantParent(
                {
                    type: ASSISTANT_EVENTS.DOWNLOAD_ERROR,
                    payload: {
                        error,
                    },
                },
                parentURL
            );
        }
    };

    // Request to cancel an ongoing download.
    //
    // This will return immediately, but the cancellation will be complete when the startDownload() promise is
    // resolved, which shouldn't take long.
    const cancelDownload = () => {
        if (abortController) {
            abortController.abort();
            abortController = undefined;
        }
    };

    const handleReceivedEvent = async (event: MessageEvent) => {
        if (!isAssistantPostMessage(event)) {
            return;
        }

        switch (event.data.type) {
            case ASSISTANT_EVENTS.START_DOWNLOAD:
                {
                    // If we passed all the validations and receive a start download event,
                    // we assume the parent url is the origin of the received event
                    parentURL = event.origin;

                    const { config, modelVariant, filesToIgnore } = event.data.payload;
                    await handleDownloadModel(config, modelVariant, filesToIgnore);
                }
                break;
            case ASSISTANT_EVENTS.PAUSE_DOWNLOAD:
                {
                    cancelDownload();
                }
                break;
        }
    };

    window.addEventListener('message', handleReceivedEvent);
});
