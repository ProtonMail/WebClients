import { type FC } from 'react';

import { AliasContent } from '@proton/pass/components/Item/Alias/Alias.content';
import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCard.content';
import { IdentityContent } from '@proton/pass/components/Item/Identity/Identity.content';
import { presentListItem } from '@proton/pass/components/Item/List/utils';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { NoteContent } from '@proton/pass/components/Item/Note/Note.content';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import type { Item, ItemType } from '@proton/pass/types';
import capitalize from '@proton/utils/capitalize';
import clsx from '@proton/utils/clsx';

const itemContentViewMap: { [T in ItemType]: FC<ItemContentProps<T>> } = {
    alias: AliasContent,
    creditCard: CreditCardContent,
    login: LoginContent,
    note: NoteContent,
    identity: IdentityContent,
};

export const ItemContentView: FC<ItemContentProps> = ({ revision, secureLinkItem }) => {
    const item = revision.data as Item;
    const Component = itemContentViewMap[item.type] as FC<ItemContentProps>;
    const { heading } = presentListItem(revision);

    return (
        <Card className="border border-weak">
            <section className={clsx('text-left', itemTypeToSubThemeClassName[item.type])}>
                <h3 className="text-bold mb-4">{capitalize(heading)}</h3>
                <Component revision={revision} secureLinkItem={secureLinkItem} />
            </section>
        </Card>
    );
};
