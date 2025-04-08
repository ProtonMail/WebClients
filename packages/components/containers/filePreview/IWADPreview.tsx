import { useEffect, useRef, useState } from 'react';

interface IWADPreviewProps {
    contents: Uint8Array[];
    filename?: string;
}

const IWADPreview = ({ contents, filename = 'doom.wad' }: IWADPreviewProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFrameReady, setIsFrameReady] = useState(false);
    const [gameLoaded, setGameLoaded] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'FRAME_READY') {
                setIsFrameReady(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
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

    return (
        <div className="flex flex-column w-full h-full">
            <iframe
                ref={iframeRef}
                src="/assets/static/iwad/game.html"
                title="IWAD Preview"
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                referrerPolicy="same-origin"
            />
        </div>
    );
};

export default IWADPreview;
