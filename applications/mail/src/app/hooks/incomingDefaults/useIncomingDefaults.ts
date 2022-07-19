import { useSelector } from 'react-redux';

import { IncomingDefault, IncomingDefaultStatus } from '@proton/shared/lib/interfaces';

import {
    getIncomingDefaultStatus,
    getIncomingDefaultsAddresses,
} from '../../logic/incomingDefaults/incomingDefaultsSelectors';
import { RootState } from '../../logic/store';

export const useIncomingDefaultsAddresses = (): IncomingDefault[] =>
    useSelector((state: RootState) => getIncomingDefaultsAddresses(state));

export const useIncomingDefaultsStatus = (): IncomingDefaultStatus =>
    useSelector((state: RootState) => getIncomingDefaultStatus(state));
