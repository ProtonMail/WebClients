import type { VFC } from 'react';

import { c, msgid } from 'ttag';

import type { Maybe, VaultShare, WithItemCount } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { VaultIcon } from './VaultIcon';

export type SharedVaultItemProps = {
    vault: Maybe<WithItemCount<VaultShare>>;
    className?: string;
};

export const SharedVaultItem: VFC<SharedVaultItemProps> = ({ vault, className }: SharedVaultItemProps) =>
    vault ? (
        <div className={clsx(['flex flex-align-items-center gap-3', className])}>
            <VaultIcon color={vault.content.display.color} icon={vault.content.display.icon} size={20} background />
            <div className="flex-item-fluid">
                <div className="text-xl text-bold text-ellipsis">{vault.content.name}</div>
                <span className="color-weak">
                    {c('Info').ngettext(msgid`${vault.count} item`, `${vault.count} items`, vault.count)}
                </span>
            </div>
        </div>
    ) : null;
