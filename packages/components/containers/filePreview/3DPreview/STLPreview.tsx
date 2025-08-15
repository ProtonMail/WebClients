import React, { useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import PreviewError from '../PreviewError';
import PreviewLoader from '../PreviewLoader';
import type { SceneRef } from './STLPreviewSetup';
import { initThreeJS } from './STLPreviewSetup';

interface STLPreviewProps {
    stlFile: Uint8Array<ArrayBuffer>[];
    onDownload?: () => void;
}

const STLPreview = ({ stlFile }: STLPreviewProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<SceneRef | null>(null);
    const [error, setError] = useState<string>();

    useLayoutEffect(() => {
        if (containerRef.current) {
            if (sceneRef.current) {
                sceneRef.current.dispose();
            }

            try {
                const mergedArray = mergeUint8Arrays(stlFile);
                sceneRef.current = initThreeJS(containerRef.current, mergedArray.buffer);
                setIsLoading(false);
            } catch (error) {
                if (error instanceof Error && error.message) {
                    setError(error.message);
                } else {
                    setError(c('Error').t`Failed to load the STL preview`);
                }
            }
        }

        return () => {
            if (sceneRef.current) {
                sceneRef.current.dispose();
            }
        };
    }, [stlFile]);

    if (error) {
        return <PreviewError error={error} />;
    }

    return (
        <>
            {isLoading && <PreviewLoader />}
            <div className="h-full" ref={containerRef} />
        </>
    );
};

export default STLPreview;
