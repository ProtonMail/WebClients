import type { ComponentPropsWithoutRef } from 'react';
import { useContext } from 'react';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import clsx from '@proton/utils/clsx';

import { ModalContext } from './Modal';

import './ModalContent.scss';

export type ModalContentProps = { unstyled?: boolean } & ComponentPropsWithoutRef<'div'>;

/**
 * Wraps content into a scrollable element.
 *
 * Default margins applied unless `unstyled` prop is set to true.
 */
const ModalContent = ({ className, unstyled, ...rest }: ModalContentProps) => {
    const { id } = useContext(ModalContext);

    return (
        <Scroll className="overflow-hidden" scrollContained>
            <div id={`${id}-description`} className={clsx([className, !unstyled && 'modal-two-content'])} {...rest} />
        </Scroll>
    );
};

export default ModalContent;
