import { useEffect, useState } from 'react';

import type { RecordingCodec } from '../codec/types';
import { WEBCODECS_MP4_CODEC } from '../mediaEncoder/webCodecsRecorder';

export const useRecordingCodec = ({ enabled }: { enabled: boolean }): RecordingCodec | null => {
    const [codec, setCodec] = useState<RecordingCodec | null>(null);

    useEffect(() => {
        if (!enabled || codec) {
            return;
        }

        setCodec(WEBCODECS_MP4_CODEC);
    }, [enabled, codec]);

    return codec;
};
