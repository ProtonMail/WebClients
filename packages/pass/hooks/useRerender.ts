import { useMemo, useState } from 'react';

export const useRerender = (prefix: string = 'key'): [string, () => void] => {
    const [renderKey, setRenderKey] = useState(0);
    return useMemo(() => [`${prefix}-${renderKey}`, () => setRenderKey((key) => key + 1)], [renderKey]);
};
