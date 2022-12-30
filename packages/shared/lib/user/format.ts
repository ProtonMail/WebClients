import { User } from '@proton/shared/lib/interfaces';

import { canPay, isAdmin, isFree, isMember, isPaid } from './helpers';

const format = (user: User) => {
    return {
        ...user,
        isFree: isFree(user),
        isPaid: isPaid(user),
        isAdmin: isAdmin(user),
        isMember: isMember(user),
        canPay: canPay(user),
    };
};

export default format;
