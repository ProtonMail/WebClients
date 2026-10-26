import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import './ApiBaseUrlBar.scss';

export const ApiBaseUrlBar = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 1500);
        });
    }, [url]);

    return (
        <div className="api-docs-base-url-bar">
            <span className="api-docs-base-url-label">{c('collider_2025: Label').t`Base URL`}</span>
            <code className="api-docs-base-url-value text-monospace">{url}</code>
            <Button size="small" shape="ghost" color="weak" type="button" onClick={handleCopy}>
                {copied ? c('Action').t`Copied` : c('Action').t`Copy`}
            </Button>
        </div>
    );
};
