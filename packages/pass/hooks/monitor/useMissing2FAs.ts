import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectLoginItems } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useMissing2FAs = (): { data: UniqueItem[]; count: number } => {
    const { monitor } = usePassCore();
    const logins = useSelector(selectLoginItems);
    const [data, setData] = useState<UniqueItem[]>([]);

    useEffect(() => {
        (async () => {
            const missing2FAs = await monitor.checkMissing2FAs();
            setData(missing2FAs);
        })().catch(noop);
    }, [logins]);

    return { data, count: data.length };
};
