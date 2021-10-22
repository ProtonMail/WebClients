import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';
import { Scroll } from '../scroll';
import './ModalContent.scss';

const ModalContent = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return (
        <Scroll className="overflow-hidden my1">
            <div className={classnames([className, 'modal-two-content'])} {...rest} />
        </Scroll>
    );
};

export default ModalContent;
