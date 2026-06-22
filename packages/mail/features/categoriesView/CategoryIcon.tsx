import { IcBell } from '@proton/icons/icons/IcBell';
import { IcBellFilled2 } from '@proton/icons/icons/IcBellFilled2';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcCreditCardsFilled } from '@proton/icons/icons/IcCreditCardsFilled';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcInboxFilled } from '@proton/icons/icons/IcInboxFilled';
import { IcMegaphone } from '@proton/icons/icons/IcMegaphone';
import { IcMegaphoneFilled } from '@proton/icons/icons/IcMegaphoneFilled';
import { IcNews } from '@proton/icons/icons/IcNews';
import { IcNewsFilled } from '@proton/icons/icons/IcNewsFilled';
import { IcPerson2 } from '@proton/icons/icons/IcPerson2';
import { IcPersonFilled2 } from '@proton/icons/icons/IcPersonFilled2';
import type { IconName } from '@proton/icons/types';
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

type Variant = 'filled' | 'outlined';

interface Props {
    categoryId: CategoryLabelID;
    variant: Variant;
    className?: string;
    colorShade?: string;
}

const CATEGORY_ICONS: Record<CategoryLabelID, Record<Variant, { Component: any; name: IconName }>> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: {
        filled: { Component: IcInboxFilled, name: 'inbox-filled' },
        outlined: { Component: IcInbox, name: 'inbox' },
    },
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: {
        filled: { Component: IcPersonFilled2, name: 'person-filled-2' },
        outlined: { Component: IcPerson2, name: 'person-2' },
    },
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: {
        filled: { Component: IcMegaphoneFilled, name: 'megaphone-filled' },
        outlined: { Component: IcMegaphone, name: 'megaphone' },
    },
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: {
        filled: { Component: IcNewsFilled, name: 'news-filled' },
        outlined: { Component: IcNews, name: 'news' },
    },
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: {
        filled: { Component: IcCreditCardsFilled, name: 'credit-cards-filled' },
        outlined: { Component: IcCreditCard, name: 'credit-cards' },
    },
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: {
        filled: { Component: IcBellFilled2, name: 'bell-filled-2' },
        outlined: { Component: IcBell, name: 'bell-2' },
    },
};

export const getCategoryIconName = (categoryId: CategoryLabelID, variant: Variant): IconName => {
    return CATEGORY_ICONS[categoryId][variant].name;
};

export const CategoryIcon = ({ categoryId, variant, className, colorShade }: Props) => {
    const { Component } = CATEGORY_ICONS[categoryId][variant];
    return <Component className={className} data-color={colorShade} />;
};
