import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import type { SafeErrorObject } from '@proton/utils/getSafeErrorObject';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array<ArrayBuffer>[];
    onDownload?: () => void;
}

export const SandboxedPreview: FC<Props> = ({ contents, mimeType, onDownload }) => {
    const [isError, setError] = useState(false);
    const ref = useRef<HTMLIFrameElement>(null);

    // Word document can have custom styles that can include external link.
    // We want to block those external request for security reasons.
    const csp = `style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' blob: data:; default-src 'self'; script-src 'self' ${origin}`;

    useEffect(() => {
        const sandbox = ref.current;

        if (isError || !sandbox || !contents) {
            return;
        }

        const handleError = (e: SafeErrorObject) => {
            // We rebuild the error as Sentry does not log objects properly
            const error = new Error(getNonEmptyErrorMessage(e));
            error.name = e.name || 'Error';
            error.stack = e.stack;

            traceError(error);
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
               <meta http-equiv="Content-Security-Policy" content="${csp}">

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
            <div className="flex flex-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="file" />
            </div>
        );
    }

    return (
        <iframe
            title={c('Title').t`Preview`}
            src="about:blank"
            ref={ref}
            className="file-preview-container w-full h-full"
            sandbox="allow-scripts"
            // Attribute is still experimental: https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/csp
            // @ts-ignore
            csp={csp}
        />
    );
};

export default SandboxedPreview;
