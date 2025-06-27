import { type FC, useMemo } from 'react';

import chunk from '@proton/utils/chunk';

export const OTPValue: FC<{ code?: string }> = ({ code }) => {
    const formatted = useMemo(() => {
        if (!code || code.length % 3) return code;
        return chunk(Array.from(code), 3)
            .map((part) => part.join(''))
            .join(' ');
    }, [code]);

    return <>{formatted}</>;
};
