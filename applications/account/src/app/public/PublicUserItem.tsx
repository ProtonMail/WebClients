import { forwardRef } from 'react';

import { getInitials } from '@proton/shared/lib/helpers/string';
import type { User } from '@proton/shared/lib/interfaces/User';

import './PublicUserItem.scss';

interface UserItemProps {
    User: User;
}

const UserItem = forwardRef<HTMLButtonElement, UserItemProps>(({ User, ...rest }: { User: User }, ref) => {
    const nameToDisplay = User.DisplayName || User.Name || User.Email || '';
    const initials = getInitials(nameToDisplay);
    return (
        <div className="public-user-item color-primary">
            <button
                type="button"
                {...rest}
                className="public-user-item--container color-primary w-full max-w-custom flex interactive items-start rounded p-2 text-right relative text-sm"
                style={{ '--max-w-custom': '25em' }}
                ref={ref}
            >
                <div className="mr-3 flex-1 mt-custom" style={{ '--mt-custom': `-0.25em` }}>
                    <div className="text-right">
                        <div className="text-ellipsis text-bold">{nameToDisplay}</div>
                        {User.Email && <div className="text-ellipsis">{User.Email}</div>}
                    </div>
                </div>
                <div>
                    <div className="public-user-item--initials flex rounded">
                        <span className="m-auto text-semibold" aria-hidden="true">
                            {initials}
                        </span>
                    </div>
                </div>
            </button>
        </div>
    );
});

export default UserItem;
