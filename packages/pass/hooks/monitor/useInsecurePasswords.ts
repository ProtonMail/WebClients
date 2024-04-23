import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectLoginItems } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useInsecurePasswords = (): { data: UniqueItem[]; count: number } => {
    const { monitor } = usePassCore();
    const logins = useSelector(selectLoginItems);
    const [data, setData] = useState<UniqueItem[]>([]);

    useEffect(() => {
        requestIdleCallback(() => {
            (async () => {
                const weakPasswords = await monitor.checkWeakPasswords();
                setData(weakPasswords);
            })().catch(noop);
        });
    }, [logins]);

    return { data, count: data.length };
};
