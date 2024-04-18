import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectLoginItems } from '@proton/pass/store/selectors';
import type { LoginItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useWeakPasswords = (): LoginItem[] => {
    const { monitor } = usePassCore();
    const logins = useSelector(selectLoginItems);
    const [items, setItems] = useState<LoginItem[]>([]);

    useEffect(() => {
        (async () => {
            const weakPasswords = await monitor.checkWeakPasswords(logins);
            setItems(weakPasswords);
        })().catch(noop);
    }, [logins]);

    return items;
};
