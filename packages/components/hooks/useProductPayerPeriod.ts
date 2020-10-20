import { useEffect, useState } from 'react';
import { isProductPayerPeriod } from 'proton-shared/lib/helpers/blackfriday';

const EVERY_MINUTE = 60 * 1000;

const useProductPayerPeriod = () => {
    const [productPayer, setProductPayer] = useState(isProductPayerPeriod());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setProductPayer(isProductPayerPeriod());
        }, EVERY_MINUTE);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return productPayer;
};

export default useProductPayerPeriod;
