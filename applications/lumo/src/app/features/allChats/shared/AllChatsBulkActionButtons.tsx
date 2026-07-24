import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

interface AllChatsBulkActionButtonsProps {
    onBulkDelete: () => void;
    onBulkFavorite: () => void;
    size?: 'small' | 'medium';
    disabled?: boolean;
    className?: string;
}

export const AllChatsBulkActionButtons = ({
    onBulkDelete,
    onBulkFavorite,
    size = 'medium',
    disabled = false,
    className,
}: AllChatsBulkActionButtonsProps) => {
    const iconSize = size === 'small' ? 12 : 14;

    return (
        <>
            <Button
                shape="outline"
                color="weak"
                size={size}
                className="all-chats-header-action-button shrink-0 flex flex-nowrap items-center gap-2"
                disabled={disabled}
                onClick={onBulkDelete}
            >
                <LumoIcon name="Trash2" size={iconSize} className="shrink-0" />
                <span>{c('collider_2025:Action').t`Delete`}</span>
            </Button>
            <Button
                shape="outline"
                size={size}
                className={clsx(
                    'all-chats-header-action-button shrink-0 flex flex-nowrap items-center gap-2',
                    className
                )}
                disabled={disabled}
                onClick={onBulkFavorite}
            >
                <LumoIcon name="Star" size={iconSize} className="shrink-0" />
                <span>{c('collider_2025:Action').t`Favorite`}</span>
            </Button>
        </>
    );
};
