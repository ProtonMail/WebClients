import { FC, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { traceError } from '@proton/shared/lib/helpers/sentry';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import useSyncIframeStyles from '../../containers/themes/useSyncIframeStyles';
import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
    onDownload?: () => void;
}

export const SandboxedPreview: FC<Props> = ({ contents, mimeType, onDownload }) => {
    const [isError, setError] = useState(false);
    const ref = useRef<HTMLIFrameElement>(null);

    useSyncIframeStyles(ref.current?.contentWindow?.document.documentElement, document.documentElement);

    useEffect(() => {
        const sandbox = ref.current;

        if (isError || !sandbox || !contents) {
            return;
        }

        const handleError = (e: Error) => {
            traceError(e);
            setError(true);
        };

        const onSandboxMessage = (event: MessageEvent) => {
            const contentWindow = sandbox.contentWindow;
            const { origin, data, source } = event;

            if (!contentWindow || origin !== 'null' || !data || source !== contentWindow) {
                return;
            }

            if (data.type === 'error') {
                handleError(data.error);
            }
        };
        window.addEventListener('message', onSandboxMessage);

        const onSandboxLoad = () => {
            // Only '*' seems to work here
            sandbox.contentWindow?.postMessage({ type: 'data', mimeType, data: mergeUint8Arrays(contents) }, '*');
        };
        sandbox.addEventListener('load', onSandboxLoad);

        const origin = window.location.origin;

        const setSandboxUrl = async () => {
            const html = `<!doctype html><html>
            <head>
            <style>html, body { border: 0; margin: 0; padding: 0; width: 100%; height: 100%; }</style>
            <script type='text/javascript' src='${origin}/assets/sandbox.js'></script>
            </head>
            <body></body>
            </html>`;
            const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

            sandbox.setAttribute('src', url);
        };

        setSandboxUrl().catch(handleError);

        return () => {
            window.removeEventListener('message', onSandboxMessage);
        };
    }, [contents]);

    if (isError) {
        return (
            <div className="flex flex-item-fluid-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="file" />
            </div>
        );
    }

    return (
        <iframe
            title={c('Title').t`Preview`}
            src="about:blank"
            ref={ref}
            className="file-preview-container w100 h100"
            sandbox="allow-scripts"
        />
    );
};

export default SandboxedPreview;
