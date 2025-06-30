import { useRef } from 'react';

import { useUser } from '@proton/account/user/hooks';
import clsx from '@proton/utils/clsx';

export const UserInfo = () => {
    const [user] = useUser();

    const colorIndex = useRef(Math.ceil(6 * Math.random()));

    if (!user) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-column items-end">
                <div className="color-norm">{user.Name}</div>
                <div className="color-weak">{user.Email}</div>
            </div>
            <div
                className={clsx(
                    'w-custom h-custom flex justify-center items-center rounded-full',
                    `meet-background-${colorIndex.current}`,
                    `profile-color-${colorIndex.current}`
                )}
                style={{
                    '--w-custom': '2.5rem',
                    '--h-custom': '2.5rem',
                }}
            >
                {user.Name.charAt(0).toUpperCase()}
            </div>
        </div>
    );
};
