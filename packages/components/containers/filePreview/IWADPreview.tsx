import { useEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';

import PreviewError from './PreviewError';
import PreviewLoader from './PreviewLoader';

interface IWADPreviewProps {
    contents: Uint8Array<ArrayBuffer>[];
    filename?: string;
}

const GAME_TIMEOUT = 1000 * 5; // 5 seconds

const IWADPreview = ({ contents, filename = 'doom.wad' }: IWADPreviewProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFrameReady, setIsFrameReady] = useState(false);
    const [isGameReady, setIsGameReady] = useState(false);
    const [gameLoaded, setGameLoaded] = useState(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'FRAME_READY') {
                setIsFrameReady(true);
                timeout = setTimeout(() => {
                    setIsGameReady(true);
                }, GAME_TIMEOUT);
            }
            if (event.data === 'FAILED_RUNNING_GAME' && !isGameReady) {
                clearTimeout(timeout);
                setError(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (isFrameReady && contents && contents.length > 0 && !gameLoaded && iframeRef.current) {
            const file = new File(contents, filename, { type: 'application/x-doom' });
            void file.arrayBuffer().then((data) => {
                const fileData = new Uint8Array(data);
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow?.postMessage(
                        {
                            type: 'LOAD_GAME',
                            fileName: filename,
                            fileData: fileData,
                        },
                        '*'
                    );
                    setGameLoaded(true);
                } else {
                    throw new Error('Could not preview this file');
                }
            });
        }
    }, [isFrameReady, contents, filename, gameLoaded]);

    useEffect(() => {
        setGameLoaded(false);
    }, [contents, filename]);

    if (!isGameReady && error) {
        return <PreviewError error={''} />;
    }

    return (
        <>
            {!isGameReady && <PreviewLoader />}
            <div className={clsx('flex flex-column w-full h-full', !isGameReady && 'hidden')}>
                <iframe
                    ref={iframeRef}
                    src="/assets/static/iwad/game.html"
                    title="IWAD Preview"
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                    referrerPolicy="same-origin"
                />
            </div>
        </>
    );
};

export default IWADPreview;
