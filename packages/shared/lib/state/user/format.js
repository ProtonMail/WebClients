import { isPaid, isFree, isAdmin, isMember } from './helpers';

const format = (user) => {
    return {
        ...user,
        isFree: isFree(user),
        isPaid: isPaid(user),
        isAdmin: isAdmin(user),
        isMember: isMember(user)
    };
};

export default format;