import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';

export const isSelfAddress = (email: string | undefined, addresses: Address[]) =>
    !!addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email || ''));

// Group and handle addresses can't be linked to a wallet account nor used as sender
const getIsBitcoinViaEmailAddress = ({ Type }: Pick<Address, 'Type'>) =>
    Type !== ADDRESS_TYPE.TYPE_GROUP && Type !== ADDRESS_TYPE.TYPE_HANDLE;

export const getBitcoinViaEmailAddresses = (addresses: Address[] = []) => addresses.filter(getIsBitcoinViaEmailAddress);
