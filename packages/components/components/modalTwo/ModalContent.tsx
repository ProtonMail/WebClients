import { ComponentPropsWithoutRef, useContext } from 'react';

import { Scroll } from '@proton/atoms/Scroll';

import { classnames } from '../../helpers';
import { ModalContext } from './Modal';

import './ModalContent.scss';

export type ModalContentProps = ComponentPropsWithoutRef<'div'>;

const ModalContent = ({ className, ...rest }: ModalContentProps) => {
    const { id } = useContext(ModalContext);

    return (
        <Scroll className="overflow-hidden">
            <div id={`${id}-description`} className={classnames([className, 'modal-two-content'])} {...rest} />
        </Scroll>
    );
};

export default ModalContent;
