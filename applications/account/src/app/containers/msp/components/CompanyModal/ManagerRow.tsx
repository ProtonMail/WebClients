import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    name: string;
    email?: string;
    loading?: boolean;
    onRemove: () => void;
}

const ManagerRow = ({ name, email, loading, onRemove }: Props) => {
    return (
        <div className="flex items-center gap-3 py-2">
            <Avatar className="shrink-0 text-rg text-semibold" color="weak">
                {getInitials(name || email || '')}
            </Avatar>
            <div className="flex flex-column flex-1 min-w-0">
                <span className="text-ellipsis" title={name}>
                    {name}
                </span>
                {email && email !== name && (
                    <span className="text-sm color-weak text-ellipsis" title={email}>
                        {email}
                    </span>
                )}
            </div>
            <Button
                shape="ghost"
                size="small"
                icon
                loading={loading}
                disabled={loading}
                onClick={onRemove}
                title={c('Action').t`Remove manager`}
            >
                <IcCross size={4} alt={c('Action').t`Remove manager`} />
            </Button>
        </div>
    );
};

export default ManagerRow;
