import { useRef, useState } from 'react';

import '@mlc-ai/web-llm';
import { ChatWorkerClient, InitProgressReport } from '@mlc-ai/web-llm';

import { isPlainText } from '@proton/shared/lib/mail/messages';

import { MessageChange } from '../components/composer/Composer';
import { MessageState } from '../store/messages/messagesTypes';
import mlcConfig from './mlc-config';

const INSTRUCTIONS =
    'You write email messages according to the description provided by the user. Do not use emojis. The first line should be "Subject:" followed by the subject, and then "Body:" followed by the body of the message.';

type GenieModelStatus = 'unloaded' | 'downloading' | 'loading' | 'loaded';

interface Props {
    message: MessageState;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
}
const useGenieModel = ({ message, onChange, onChangeContent }: Props) => {
    const [genieWish, setGenieWish] = useState<string>('');
    const chat = useRef<ChatWorkerClient | null>(null);
    const [genieModelStatus, setGenieModelStatus] = useState<GenieModelStatus>('unloaded');
    const [genieModelDownloadProgress, setGenieModelDownloadProgress] = useState<number>(0); // 0-1

    const setSubject = (subject: string) => {
        onChange({ data: { Subject: subject } });
    };

    const setBody = (body: string) => {
        if (isPlainText(message.data)) {
            onChangeContent(body, true);
        } else {
            const bodyHtml = body.replaceAll('\n', '<br>');
            onChangeContent(bodyHtml, true);
        }
    };

    const handleGenieKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            console.log('Genie wish:', genieWish);

            if (!chat.current) {
                console.log('Genie model not loaded');
                return;
            }
            const generateProgressCallback = (_step: number, message: string) => {
                const newlineIndex = message.indexOf('\n');
                if (newlineIndex > 0) {
                    const firstLine = message.substring(0, newlineIndex).trim();
                    let rest = message.substring(newlineIndex + 1).trim();
                    if (rest.startsWith('Body:')) {
                        rest = rest.substring('Body:'.length).trim();
                    }
                    setSubject(firstLine);
                    setBody(rest);
                    console.log(firstLine);
                    console.log(rest);
                } else {
                    setSubject(message);
                }
            };
            const prompt0 = `<|instructions|>\n${INSTRUCTIONS}\n\n<|user|>\n${genieWish}\n\n<|assistant|>\nSubject: `;
            console.log(prompt0);
            const reply0 = await chat.current.generate(prompt0, generateProgressCallback);
            console.log(reply0);
            console.log(await chat.current.runtimeStatsText());
        }
    };

    const startLoadingGenieModel = async () => {
        if (chat.current === null) {
            console.log('loading worker...');
            chat.current = new ChatWorkerClient(new Worker(new URL('./worker', import.meta.url), { type: 'module' }));
            console.log('worker loaded.');
            // The "selfhost" variant below would download the weights from our assets dir (see public/assets/ml-models)
            // let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1-selfhost';
            let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1';

            setGenieModelStatus('downloading');
            setGenieModelDownloadProgress(0);
            chat.current.setInitProgressCallback((report: InitProgressReport) => {
                setGenieModelDownloadProgress(report.progress);
                console.log(report.progress);
                console.log(report.text);
                if (report.progress == 1) {
                    setGenieModelStatus('loading');
                }
            });
            const chatOpts = {};
            await chat.current.reload(variant, chatOpts, mlcConfig);
            setGenieModelStatus('loaded');
        }
    };

    const stopLoadingGenieModel = async () => {
        if (chat.current !== null) {
            console.log('unloading model');
            await chat.current.unload();
            console.log('unloaded model');
            chat.current = null;
            setGenieModelStatus('unloaded');
        }
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
