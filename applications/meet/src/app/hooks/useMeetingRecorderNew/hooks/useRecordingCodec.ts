import { useEffect, useState } from 'react';

import { getSupportedRecordingCodec } from '../codec/getSupportedCodec';
import type { RecordingCodec } from '../codec/types';

// Detects the supported codec exactly once and only when recording is allowed.
// The probe is expensive (real MediaRecorder runs against a canvas stream), so
// we keep the result cached in component state.
export const useRecordingCodec = (enabled: boolean): RecordingCodec | null => {
    const [codec, setCodec] = useState<RecordingCodec | null>(null);

    useEffect(() => {
        if (!enabled || codec) {
            return;
        }

        let cancelled = false;
        void getSupportedRecordingCodec().then((detected) => {
            if (!cancelled) {
                setCodec(detected);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [enabled, codec]);

    return codec;
};
