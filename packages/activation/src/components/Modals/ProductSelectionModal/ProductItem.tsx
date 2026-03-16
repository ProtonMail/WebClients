import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ImportType } from '@proton/activation/src/interface';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcUsers } from '@proton/icons/icons/IcUsers';

const productMap = {
    [ImportType.MAIL]: {
        getLabel: () => c('').t`Emails`,
        icon: <IcEnvelope className="shrink-0" />,
    },
    [ImportType.CALENDAR]: {
        getLabel: () => c('').t`Calendars`,
        icon: <IcCalendarGrid className="shrink-0" />,
    },
    [ImportType.CONTACTS]: {
        getLabel: () => c('').t`Contacts`,
        icon: <IcUsers className="shrink-0" />,
    },
};

interface Props {
    product: ImportType;
    disabled?: boolean;
    disabledText?: ReactNode;
}

export const ProductItem = ({ product, disabled, disabledText }: Props) => {
    return (
        <div className="flex-1 flex flex-column flex-nowrap">
            <div className="flex flex-row flex-nowrap gap-2 items-center">
                {productMap[product].icon}
                <span className="flex-1">{productMap[product].getLabel()}</span>
            </div>
            {disabled && disabledText && <div className="block text-sm color-weak">{disabledText}</div>}
        </div>
    );
};
