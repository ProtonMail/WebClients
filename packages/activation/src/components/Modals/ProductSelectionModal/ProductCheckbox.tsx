import type { ReactNode } from 'react';

import { ProductItem } from '@proton/activation/src/components/Modals/ProductSelectionModal/ProductItem';
import type { ImportType } from '@proton/activation/src/interface';
import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    product: ImportType;
    checked: boolean;
    onToggleProduct: (product: ImportType, checked: boolean) => void;
    disabled?: boolean;
    disabledText?: ReactNode;
}

export const ProductCheckbox = ({ product, onToggleProduct, disabled, disabledText, checked }: Props) => {
    return (
        <Label
            htmlFor={product}
            className={clsx(['flex flex-row flex-nowrap w-full gap-4 pt-0', disabled && 'cursor-default color-weak'])}
            data-testid="StepProductsRowItem:label"
        >
            <Checkbox
                id={product}
                checked={disabled ? false : checked}
                onChange={(e) => onToggleProduct(product, e.target.checked)}
                className="self-start"
                disabled={disabled}
                data-testid={`productCheckbox:${product}`}
            />
            <ProductItem product={product} disabled={disabled} disabledText={disabledText} />
        </Label>
    );
};
