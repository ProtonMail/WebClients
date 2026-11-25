import { c } from 'ttag';

import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Logo from '@proton/components/components/logo/Logo';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { RetentionRuleProduct } from '@proton/shared/lib/interfaces/RetentionRule';

import { SUPPORTED_PRODUCTS } from './constants';
import { getLogoProductLabel, getProductLabel } from './helpers';

import './ProductSelection.scss';

interface Props {
    selectedProduct: RetentionRuleProduct;
    onChange: (product: RetentionRuleProduct) => void;
}

const ProductSelection = ({ selectedProduct, onChange }: Props) => {
    return (
        <div className="mb-4 retention-policy-product-selection">
            <label className="text-semibold block mb-2">{c('retention_policy_2025_Label').t`Select product`}</label>
            <SelectTwo
                value={selectedProduct}
                onValue={onChange}
                size={{
                    height: DropdownSizeUnit.Dynamic,
                    width: DropdownSizeUnit.Anchor,
                    maxWidth: DropdownSizeUnit.Viewport,
                }}
                dropdownClassName="retention-policy-dropdown"
            >
                {SUPPORTED_PRODUCTS.map((product) => (
                    <Option key={product} value={product} title={getProductLabel(product)}>
                        <div className="flex gap-2 items-center">
                            <Logo appName={getLogoProductLabel(product)} variant="glyph-only" />
                            {getProductLabel(product)}
                        </div>
                    </Option>
                ))}
            </SelectTwo>
        </div>
    );
};

export default ProductSelection;
