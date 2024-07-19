import type { PropsWithChildren, ReactNode } from 'react';

import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import './Modal.scss';

interface Props extends ModalOwnProps {
    title?: string;
    header?: ReactNode;
    subline?: string;
    className?: string;
    key?: string;
}

export const FullscreenModal = ({
    title,
    header,
    subline,
    children,
    key,
    className,
    ...rest
}: PropsWithChildren<Props>) => {
    return (
        <ModalTwo {...rest} className={clsx(className, 'wallet-fullscreen-modal')} key={key} size="full" fullscreen>
            <>
                {header ?? (
                    <ModalTwoHeader
                        title={title}
                        subline={subline && <p className="text-center mx-12">{subline}</p>}
                        closeButtonProps={{ shape: 'solid', className: 'shrink-0 rounded-full bg-norm' }}
                    />
                )}

                {/* Content */}
                <div className="modal-two-content">{children}</div>
            </>
        </ModalTwo>
    );
};
