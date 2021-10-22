import { ComponentPropsWithoutRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { Scroll } from '../scroll';
import { ModalContext } from './Modal';
import './ModalContent.scss';

const ModalContent = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    const { id } = useContext(ModalContext);

    return (
        <Scroll className="overflow-hidden my1">
            <div id={`${id}-description`} className={classnames([className, 'modal-two-content'])} {...rest} />
        </Scroll>
    );
};

export default ModalContent;
