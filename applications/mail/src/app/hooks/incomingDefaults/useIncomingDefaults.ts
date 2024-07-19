import type { IncomingDefault, IncomingDefaultStatus } from '@proton/shared/lib/interfaces';

import { useMailSelector } from 'proton-mail/store/hooks';

import {
    getIncomingDefaultStatus,
    getIncomingDefaultsAddresses,
} from '../../store/incomingDefaults/incomingDefaultsSelectors';
import type { MailState } from '../../store/store';

export const useIncomingDefaultsAddresses = (): IncomingDefault[] =>
    useMailSelector((state: MailState) => getIncomingDefaultsAddresses(state));

export const useIncomingDefaultsStatus = (): IncomingDefaultStatus =>
    useMailSelector((state: MailState) => getIncomingDefaultStatus(state));
