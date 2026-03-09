import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowsFromCenter } from '@proton/icons/icons/IcArrowsFromCenter';
import { IcArrowsToCenter } from '@proton/icons/icons/IcArrowsToCenter';
import lumoCat from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

interface HtmlPreviewPanelProps {
    html: string;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onClose: () => void;
    onRetryWithError?: (error: string) => void;
}

/**
 * Script injected into the generated HTML so we can safely cross the sandbox boundary.
 * The parent posts { type: 'lumo-resize' } via postMessage (the only API that
 * works across a sandboxed iframe origin), and this listener re-dispatches a
 * native resize event on the iframe's own window so D3/canvas/etc. recalculate.
 * It also forwards runtime errors back to the parent so they can be shown discretely.
 */
const INJECTED_SCRIPT = `<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'lumo-resize') {
    window.dispatchEvent(new Event('resize'));
  }
});
window.onerror = function(msg, _src, line, col) {
  window.parent.postMessage({ type: 'lumo-error', message: String(msg), line: line, col: col }, '*');
  return false;
};
window.addEventListener('unhandledrejection', function(e) {
  var msg = e.reason ? String(e.reason) : 'Unhandled promise rejection';
  window.parent.postMessage({ type: 'lumo-error', message: msg }, '*');
});
</script>`;

function injectScripts(html: string): string {
    if (/<\/head>/i.test(html)) {
        return html.replace(/<\/head>/i, `${INJECTED_SCRIPT}</head>`);
    }
    return INJECTED_SCRIPT + html;
}

export const HtmlPreviewPanel = ({ html, isFullscreen, onToggleFullscreen, onClose, onRetryWithError }: HtmlPreviewPanelProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // Using a blob: URL instead of srcdoc so the iframe does not inherit the
    // parent page's CSP. srcdoc iframes inherit the parent CSP by spec, which
    // blocks external CDN scripts (e.g. D3) and inline scripts in the generated
    // HTML. Blob URL iframes have no inherited CSP and blob: is already allowed
    // in the parent's script-src directive.
    useEffect(() => {
        const blob = new Blob([injectScripts(html)], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [html]);

    // Clear any previous error when new HTML is loaded
    useEffect(() => {
        setRenderError(null);
    }, [html]);

    // Listen for runtime errors posted back from the sandboxed iframe
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'lumo-error' && typeof e.data.message === 'string') {
                setRenderError(e.data.message);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new ResizeObserver(() => {
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage({ type: 'lumo-resize' }, '*');
            }, 200);
        });

        observer.observe(container);
        return () => {
            observer.disconnect();
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
        };
    }, []);

    return (
        <div className="flex flex-column h-full">
            <div className="shrink-0 flex flex-row items-center gap-2 p-3 pb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-row gap-2">
                        {isFullscreen && <img src={lumoCat} width={24} height={24} />}
                        <p className="m-0 text-md text-bold">{c('collider_2025: Label').t`HTML Preview`}</p>
                    </div>
                </div>
                <Tooltip title={isFullscreen ? c('collider_2025: Action').t`Exit full screen` : c('collider_2025: Action').t`Full screen`}>
                    <Button icon size="small" shape="ghost" onClick={onToggleFullscreen}>
                        {isFullscreen ? <IcArrowsToCenter size={4} /> : <IcArrowsFromCenter size={4} />}
                    </Button>
                </Tooltip>
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    onClick={onClose}
                    title={c('collider_2025: Action').t`Close`}
                >
                    <IcCross size={4} />
                </Button>
            </div>

            {renderError && (
                <div className="shrink-0 mx-3 mb-2 flex flex-row flex-nowrap items-center gap-2 px-3 py-1.5 rounded-lg bg-weak border border-weak text-sm">
                    <IcExclamationTriangleFilled size={3} className="shrink-0 color-warning" />
                    <Tooltip title={renderError}>
                        <span className="flex-1 text-ellipsis overflow-hidden color-weak">{renderError}</span>
                    </Tooltip>
                    {onRetryWithError && (
                        <Button
                            size="small"
                            shape="outline"
                            color="weak"
                            className="shrink-0"
                            onClick={() => {
                                onRetryWithError(renderError);
                                setRenderError(null);
                            }}
                        >
                            {c('collider_2025: Action').t`Fix this`}
                        </Button>
                    )}
                    <Button icon size="small" shape="ghost" onClick={() => setRenderError(null)}>
                        <IcCross size={3} />
                    </Button>
                </div>
            )}

            <div ref={containerRef} className="flex-1 min-h-0 mx-3 mb-3 border border-weak rounded-lg overflow-hidden">
                <iframe
                    key={isFullscreen ? 'fullscreen' : 'normal'}
                    ref={iframeRef}
                    title={c('collider_2025: Label').t`HTML Preview`}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                    src={blobUrl ?? undefined}
                />
            </div>
        </div>
    );
};
