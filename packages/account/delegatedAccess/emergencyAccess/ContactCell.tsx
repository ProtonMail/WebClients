import { Avatar } from '@proton/atoms';
import { getInitials } from '@proton/shared/lib/helpers/string';

export const ContactCell = ({ name, email, formatted }: { name: string; email: string; formatted: string }) => {
    const value = name || email;
    const initials = getInitials(value);
    return (
        <div className="flex flex-nowrap items-center gap-2">
            <Avatar color="weak">{initials}</Avatar>
            <div className="flex-1">
                <div className="text-ellipsis" data-testid="delegated-access:username" title={formatted}>
                    {value}
                </div>
                {name && (
                    <div data-testid="delegated-access:email" className="text-ellipsis color-weak" title={email}>
                        {email}
                    </div>
                )}
            </div>
        </div>
    );
};
