import { useEffect } from 'react';

import { type ProductParam, normalizeProduct } from '@proton/shared/lib/apps/product';

export const ProductAttribution = ({ productParam }: { productParam: ProductParam }) => {
    useEffect(() => {
        let node = document.querySelector('meta[name="product-attribution"]');
        if (!node) {
            node = document.createElement('meta');
            node.setAttribute('name', 'product-attribution');
            document.head.appendChild(node);
        }
        node.setAttribute('content', normalizeProduct(productParam) ?? 'generic');
    }, [productParam]);
    return null;
};
