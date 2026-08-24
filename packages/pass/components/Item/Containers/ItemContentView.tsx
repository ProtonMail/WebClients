import type { FC, PropsWithChildren } from 'react';

import capitalize from '@proton/utils/capitalize';
import clsx from '@proton/utils/clsx';

import type { Item, ItemType } from '../../../types';
import { Card } from '../../Layout/Card/Card';
import { itemTypeToSubThemeClassName } from '../../Layout/Theme/types';
import type { ItemContentProps } from '../../Views/types';
import { AliasContent } from '../Alias/Alias.content';
import { CreditCardContent } from '../CreditCard/CreditCard.content';
import { CustomContent } from '../Custom/Custom.content';
import { IdentityContent } from '../Identity/Identity.content';
import { presentListItem } from '../List/utils';
import { LoginContent } from '../Login/Login.content';
import { NoteContent } from '../Note/Note.content';

const itemContentViewMap: { [T in ItemType]: FC<ItemContentProps<T>> } = {
    alias: AliasContent,
    creditCard: CreditCardContent,
    login: LoginContent,
    note: NoteContent,
    identity: IdentityContent,
    sshKey: CustomContent,
    wifi: CustomContent,
    custom: CustomContent,
};

export const ItemContentView: FC<PropsWithChildren<ItemContentProps>> = ({ children, revision }) => {
    const item = revision.data as Item;
    const Component = itemContentViewMap[item.type] as FC<ItemContentProps>;
    const { heading } = presentListItem(revision);

    return (
        <Card className="border border-weak">
            <section className={clsx('text-left', itemTypeToSubThemeClassName[item.type])}>
                <h3 className="text-bold mb-4 text-break">{capitalize(heading)}</h3>
                <Component revision={revision} secureLinkItem />
                {children}
            </section>
        </Card>
    );
};
