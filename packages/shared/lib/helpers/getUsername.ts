import { Address, User, UserType } from '../interfaces';
import { getIsAddressEnabled } from './address';

export default function getUsername(user: User, addresses: Address[]) {
    const primaryAddress = addresses?.find(getIsAddressEnabled);
    return user.Type === UserType.EXTERNAL && primaryAddress ? primaryAddress.Email : user.Name;
}
