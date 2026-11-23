import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import './ApiBaseUrlBar.scss';

export const ApiBaseUrlBar = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 1500);
        });
    }, [url]);

    return (
        <div className="api-docs-base-url-bar gap-y-2 gap-x-3 border lumo-border radius-full lumo-bg-panel">
            <span className="api-docs-base-url-label lumo-label-small lumo-color-glyph-mid">{c('collider_2025: Label')
                .t`Base URL`}</span>
            <code className="api-docs-base-url-value lumo-font-mono lumo-title-small lumo-color-glyph">{url}</code>
            <Button size="small" shape="ghost" color="weak" type="button" onClick={handleCopy}>
                {copied ? c('Action').t`Copied` : c('Action').t`Copy`}
            </Button>
        </div>
    );
};
