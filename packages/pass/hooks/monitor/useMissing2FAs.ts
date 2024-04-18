import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectLoginItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useMissing2FAs = (): ItemRevision[] => {
    const { monitor } = usePassCore();
    const logins = useSelector(selectLoginItems);
    const [items, setItems] = useState<ItemRevision<'login'>[]>([]);

    useEffect(() => {
        (async () => {
            const missing2FAs = await monitor.checkMissing2FAs(logins);
            setItems(missing2FAs);
        })().catch(noop);
    }, [logins]);

    return items;
};
