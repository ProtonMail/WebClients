import { Avatar } from '@proton/atoms/Avatar';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    user: { DisplayName?: string; Name?: string; Email?: string };
}

const AccountSwitcherItem = ({ user }: Props) => {
    const nameToDisplay = user.DisplayName || user.Name || user.Email || '';
    const initials = getInitials(nameToDisplay);
    const email = user.Email;

    return (
        <div className="rounded-lg border p-4 pr-6">
            <div className="flex gap-4 justify-space-between flex-align-items-center">
                <div className="flex gap-4 flex-align-items-center">
                    <Avatar>{initials}</Avatar>
                    <div className="flex flex-column">
                        <div className="text-break">
                            <strong>{nameToDisplay}</strong>
                        </div>
                        {email && <div className="text-break color-weak">{email}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSwitcherItem;
