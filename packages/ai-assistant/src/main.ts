import { LlmFile, downloadModel } from '@proton/llm/lib/downloader';
import { isAssistantPostMessage, postMessageIframeToParent } from '@proton/llm/lib/helpers';
import { AssistantConfig, AssistantEvent } from '@proton/llm/lib/types';

window.addEventListener('load', async () => {
    let abortController: AbortController | undefined; // defined if status === 'loading'
    let parentURL: string;

    const handleDownloadModel = async (
        assistantConfig: AssistantConfig,
        modelVariant: string,
        filesToIgnore: LlmFile[]
    ) => {
        try {
            if (!abortController) {
                abortController = new AbortController();
                await downloadModel(modelVariant, assistantConfig, abortController, filesToIgnore, parentURL);
                abortController = undefined;
            }
        } catch (error: any) {
            postMessageIframeToParent(
                {
                    type: AssistantEvent.DOWNLOAD_ERROR,
                    payload: {
                        error,
                    },
                },
                parentURL
            );
        } finally {
            abortController = undefined;
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
            case AssistantEvent.START_DOWNLOAD:
                {
                    // If we passed all the validations and receive a start download event,
                    // we assume the parent url is the origin of the received event
                    parentURL = event.origin;

                    postMessageIframeToParent(
                        {
                            type: AssistantEvent.IFRAME_READY,
                        },
                        parentURL
                    );

                    const { config, modelVariant, filesToIgnore } = event.data.payload;
                    await handleDownloadModel(config, modelVariant, filesToIgnore);
                }
                break;
            case AssistantEvent.PAUSE_DOWNLOAD:
                {
                    cancelDownload();
                }
                break;
        }
    };

    window.addEventListener('message', handleReceivedEvent);
});
