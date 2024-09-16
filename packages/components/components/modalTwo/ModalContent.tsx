import type { ComponentPropsWithoutRef } from 'react';
import { useContext } from 'react';

import { Scroll } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { ModalContext } from './Modal';

import './ModalContent.scss';

export type ModalContentProps = ComponentPropsWithoutRef<'div'>;

const ModalContent = ({ className, ...rest }: ModalContentProps) => {
    const { id } = useContext(ModalContext);

    return (
        <Scroll className="overflow-hidden">
            <div id={`${id}-description`} className={clsx([className, 'modal-two-content'])} {...rest} />
        </Scroll>
    );
};

export default ModalContent;
