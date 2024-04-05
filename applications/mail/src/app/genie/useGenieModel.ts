import { useRef, useState } from 'react';

import { GpuLlmManager } from '@proton/llm/gpu';
import { GenerationCallback, LlmManager, LlmModel, MonitorDownloadCallback } from '@proton/llm/index';

import { MessageChange } from '../components/composer/Composer';

type GenieModelStatus = 'unloaded' | 'downloading' | 'loading' | 'loaded';

interface Props {
    onChange: MessageChange;
    setResult: (content: string) => void;
}
const useGenieModel = ({ setResult }: Props) => {
    const [genieWish, setGenieWish] = useState<string>('');
    const [genieModelStatus, setGenieModelStatus] = useState<GenieModelStatus>('unloaded');
    const [genieModelDownloadProgress, setGenieModelDownloadProgress] = useState<number>(0);
    const manager = useRef<LlmManager>(new GpuLlmManager());
    const model = useRef<LlmModel | null>(null);

    const setBody = (body: string) => {
        setResult(body);
    };

    const handleGenieKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            console.log('Genie wish:', genieWish);

            if (!model.current) {
                console.log('AI model not loaded');
                return;
            }

            const generationCallback: GenerationCallback = (_token: string, fulltext: string) => {
                let text = fulltext
                    .split('\n')
                    .filter((line) => !line.startsWith('Subject:'))
                    .join('\n')
                    .trim();
                if (text.startsWith('Body:')) {
                    text = text.substring('Body:'.length).trim();
                }
                setBody(text.trim());
            };

            // todo: this returns a RunningAction, we can use it to cancel the generation
            const runningAction = await model.current.performAction(
                {
                    type: 'writeFullEmail',
                    prompt: genieWish,
                },
                generationCallback
            );
            await runningAction.waitForCompletion();
        }
    };

    const startLoadingGenieModel = async () => {
        const callback: MonitorDownloadCallback = (progress: number, done: boolean) => {
            setGenieModelDownloadProgress(progress);
            if (done) {
                setGenieModelStatus('loading');
            }
        };
        setGenieModelStatus('downloading');
        await manager.current.startDownload(callback);
        setGenieModelStatus('loading');
        model.current = await manager.current.loadOnGpu();
        setGenieModelStatus('loaded');
    };

    const stopLoadingGenieModel = async () => {
        // manager.current.cancelDownload();
        console.log('not yet implemented');
    };

    return {
        genieModelStatus,
        genieModelDownloadProgress,

        genieWish,
        setGenieWish,

        startLoadingGenieModel,
        stopLoadingGenieModel,

        handleGenieKeyDown,
    };
};

export default useGenieModel;
