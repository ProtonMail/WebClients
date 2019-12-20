import { isPaid, isFree, isAdmin, isMember, canPay } from './helpers';

const format = (user) => {
    return {
        ...user,
        isFree: isFree(user),
        isPaid: isPaid(user),
        isAdmin: isAdmin(user),
        isMember: isMember(user),
        canPay: canPay(user)
    };
};

export default format;
