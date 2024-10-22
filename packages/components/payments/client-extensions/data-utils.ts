import { useSelector } from '@proton/redux-shared-store';
import { type UserModel } from '@proton/shared/lib/interfaces';

export const useCachedUser = () => {
    const user: UserModel | undefined = useSelector((state) => state.user.value);
    return user;
};
