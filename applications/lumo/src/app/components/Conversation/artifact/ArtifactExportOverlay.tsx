import { forwardRef, useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

export interface ArtifactExportOverlayHandle {
    updateProgress: (current: number, total: number) => void;
}

interface Props {
    formatLabel: string;
}

const getExportStatusLabel = (formatLabel: string, current: number, total: number): string => {
    if (total > 1 && current > 0) {
        return c('collider_2025: Info').t`Preparing ${formatLabel}… (${current} of ${total})`;
    }

    return c('collider_2025: Info').t`Preparing ${formatLabel}…`;
};

export const ArtifactExportOverlay = forwardRef<ArtifactExportOverlayHandle, Props>(function ArtifactExportOverlay(
    { formatLabel },
    ref
) {
    const labelRef = useRef<HTMLParagraphElement>(null);
    const defaultLabel = getExportStatusLabel(formatLabel, 0, 1);

    useImperativeHandle(ref, () => {
        return {
            updateProgress: (current: number, total: number) => {
                const labelElement = labelRef.current;

                if (!labelElement) {
                    return;
                }

                labelElement.textContent = getExportStatusLabel(formatLabel, current, total);
            },
        };
    }, [formatLabel]);

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="artifact-export-status flex flex-column items-center justify-center gap-3 flex-1 min-h-0"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="artifact-export-spinner" aria-hidden="true" />
            <p ref={labelRef} className="text-sm color-norm m-0 text-center">
                {defaultLabel}
            </p>
        </div>
    );
});
