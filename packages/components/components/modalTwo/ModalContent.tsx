import { ComponentPropsWithoutRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { Scroll } from '../scroll';
import { ModalContext } from './Modal';
import './ModalContent.scss';

const ModalContent = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    const { id } = useContext(ModalContext);

    return (
        <Scroll className="overflow-hidden">
            <div
                id={`${id}-description`}
                className={classnames([className, 'modal-two-content mt0-5 mb1'])}
                {...rest}
            />
        </Scroll>
    );
};

export default ModalContent;
