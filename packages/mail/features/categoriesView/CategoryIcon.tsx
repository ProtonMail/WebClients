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
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

interface Props {
    categoryId: CategoryLabelID;
    variant: 'filled' | 'outlined';
    className?: string;
    colorShade?: string;
}

const CATEGORY_ICONS: Record<CategoryLabelID, Record<'filled' | 'outlined', any>> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: { filled: IcInboxFilled, outlined: IcInbox },
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: { filled: IcPersonFilled2, outlined: IcPerson2 },
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: { filled: IcMegaphoneFilled, outlined: IcMegaphone },
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: { filled: IcNewsFilled, outlined: IcNews },
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: { filled: IcCreditCardsFilled, outlined: IcCreditCard },
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: { filled: IcBellFilled2, outlined: IcBell },
};

export const CategoryIcon = ({ categoryId, variant, className, colorShade }: Props) => {
    const Icon = CATEGORY_ICONS[categoryId][variant];
    return <Icon className={className} data-color={colorShade} />;
};
