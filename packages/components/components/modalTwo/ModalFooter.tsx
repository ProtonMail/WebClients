import { ComponentPropsWithoutRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { ModalContext } from './Modal';
import './ModalFooter.scss';

const ModalFooter = ({ className: classNameProp, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    const { size } = useContext(ModalContext);

    const className = classnames([classNameProp, 'modal-two-footer', size === 'full' && 'modal-two-footer--full']);

    return <div className={className} {...rest} />;
};

export default ModalFooter;
