import type { ReactNode } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

import './PromotionButtonLight.scss';

interface Props extends ButtonLikeProps<'button'> {
    children?: ReactNode;
}

const PromotionButtonLight = ({ children, ...rest }: Props) => {
    return (
        <ButtonLike {...rest} className={clsx(['promotion-button-light', rest.className])}>
            {children}
        </ButtonLike>
    );
};

export default PromotionButtonLight;
