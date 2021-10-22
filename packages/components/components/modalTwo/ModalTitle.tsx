import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';

const ModalTitle = ({ className, children, ...rest }: ComponentPropsWithoutRef<'div'>) => (
    <h3 className={classnames([className, 'text-bold'])} {...rest}>
        {children}
    </h3>
);

export default ModalTitle;
