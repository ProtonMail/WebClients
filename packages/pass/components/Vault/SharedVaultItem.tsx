import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultItemsCount } from '@proton/pass/store/selectors';
import type { VaultColor, VaultIcon as VaultIconEnum } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { getItemsText } from '../Settings/helper';
import { VaultIcon } from './VaultIcon';

type SharedVaultItemProps = {
    className?: string;
    color?: VaultColor;
    icon?: VaultIconEnum;
    name: string;
    shareId?: string;
};

export const SharedVaultItem: FC<SharedVaultItemProps> = ({
    className,
    color,
    icon,
    name,
    shareId = '',
}: SharedVaultItemProps) => {
    const count = useSelector(selectVaultItemsCount(shareId));

    return (
        <div className={clsx(['flex items-center gap-3', className])}>
            <VaultIcon color={color} icon={icon} size={5} background />
            <div className="flex-1">
                <div className="text-xl text-bold text-ellipsis">{name}</div>
                {count !== null && <span className="color-weak">{getItemsText(count)}</span>}
            </div>
        </div>
    );
};
