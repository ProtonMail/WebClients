import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useInsecurePasswords } from '@proton/pass/hooks/monitor/useInsecurePasswords';
import { useMissing2FAs } from '@proton/pass/hooks/monitor/useMissing2FAs';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import type { AddressType, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { deleteCustomAddress, getBreaches } from '@proton/pass/store/actions';
import { breachesRequest } from '@proton/pass/store/actions/requests';
import {
    selectAliasBreaches,
    selectCustomBreaches,
    selectDuplicatePasswords,
    selectExcludedItems,
    selectMonitorState,
    selectProtonBreaches,
    selectTotalBreaches,
} from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

import { CustomAddressAddModal } from './Address/CustomAddressAddModal';
import { CustomAddressVerifyModal } from './Address/CustomAddressVerifyModal';
import { MonitorContext, type MonitorContextValue } from './MonitorContext';

type MonitorAction =
    | { type: 'add' }
    | { type: 'verify'; data: MonitorAddress<AddressType.CUSTOM> & { sentAt?: number } };

export const MonitorProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const didLoad = useSelector(selectMonitorState) !== null;

    const alias = useSelector(selectAliasBreaches) ?? [];
    const proton = useSelector(selectProtonBreaches) ?? [];
    const custom = useSelector(selectCustomBreaches) ?? [];
    const count = useSelector(selectTotalBreaches) ?? 0;

    const duplicates = useSelector(selectDuplicatePasswords);
    const missing2FAs = useMissing2FAs();
    const insecure = useInsecurePasswords();
    const excluded = useSelector(selectExcludedItems);

    const [action, setAction] = useState<MaybeNull<MonitorAction>>(null);
    const onClose = () => setAction(null);

    const breaches = useRequest(getBreaches, {
        initialLoading: true,
        initialRequestId: breachesRequest(),
    });

    useEffect(() => breaches.dispatch(), []);

    const context = useMemo<MonitorContextValue>(
        () => ({
            didLoad,
            breaches: { data: { alias, proton, custom }, loading: breaches.loading, count },
            insecure,
            missing2FAs,
            duplicates: { data: duplicates, count: duplicates.length },
            excluded: { data: excluded, count: excluded.length },
            addAddress: () => setAction({ type: 'add' }),
            verifyAddress: (data, sentAt) => setAction({ type: 'verify', data: { ...data, sentAt } }),
            deleteAddress: (addressId) => dispatch(deleteCustomAddress.intent(addressId)),
            sync: breaches.revalidate,
        }),
        [breaches, insecure, duplicates, missing2FAs, excluded, alias, proton, custom, didLoad]
    );
    return (
        <MonitorContext.Provider value={context}>
            {children}

            {action?.type === 'add' && <CustomAddressAddModal onClose={onClose} />}
            {action?.type === 'verify' && <CustomAddressVerifyModal {...action.data} onClose={onClose} />}
        </MonitorContext.Provider>
    );
};
