import { ComponentPropsWithoutRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { ModalContext } from './Modal';

const ModalTitle = ({ className, children, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    const { id } = useContext(ModalContext);

    return (
        <h3 id={id} className={classnames([className, 'text-bold'])} {...rest}>
            {children}
        </h3>
    );
};

export default ModalTitle;
