import { Avatar } from '@proton/atoms';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

interface Props {
    email: string;
    name?: string;
}

export const UserCell = ({ email, name }: Props) => {
    return (
        <div className="flex gap-2">
            <Avatar className="shrink-0 text-rg" color="weak">
                {getInitials(name || email)}
            </Avatar>
            <span className="flex-1 flex flex-column justify-center">
                {name && (
                    <span className="block color-norm max-w-full text-ellipsis" title={name}>
                        {name}
                    </span>
                )}
                <span
                    className={clsx('block max-w-full text-ellipsis color-norm', name && 'color-weak text-sm')}
                    title={email}
                >
                    {email}
                </span>
            </span>
        </div>
    );
};
