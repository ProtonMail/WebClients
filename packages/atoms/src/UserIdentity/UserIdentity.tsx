import { shouldDisplayEmailNextToName } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { Avatar } from '../Avatar/Avatar';

interface UserIdentityProps {
    name?: string;
    email?: string;
    /** Makes the name and email a button, e.g. to filter a table by this user. */
    onClick?: () => void;
    className?: string;
    'data-testid'?: string;
}

/**
 * An avatar with the user's name and email stacked next to it.
 * The email is only shown when it adds information, so a name equal to the email renders as a single line,
 * vertically centered with the avatar.
 * The name inherits its color from the parent, so it follows e.g. a `color-weak` table.
 */
export const UserIdentity = ({ name, email, onClick, className, 'data-testid': dataTestId }: UserIdentityProps) => {
    const primary = name || email;

    if (!primary) {
        return null;
    }

    const showEmail = shouldDisplayEmailNextToName(name, email);

    const text = (
        <>
            <span className="block max-w-full text-ellipsis" title={primary}>
                {primary}
            </span>
            {showEmail && (
                <span className="block max-w-full text-ellipsis color-weak" title={email}>
                    {email}
                </span>
            )}
        </>
    );

    return (
        <div className={clsx('flex flex-nowrap items-center gap-2 min-w-0', className)} data-testid={dataTestId}>
            <Avatar className="shrink-0" color="weak">
                {getInitials(primary)}
            </Avatar>
            {onClick ? (
                <button
                    type="button"
                    className="flex-1 flex flex-column flex-nowrap min-w-0 text-left relative interactive-pseudo-protrude interactive--no-background rounded"
                    onClick={onClick}
                >
                    {text}
                </button>
            ) : (
                <div className="flex-1 flex flex-column flex-nowrap min-w-0">{text}</div>
            )}
        </div>
    );
};
