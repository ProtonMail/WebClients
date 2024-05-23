import { PropsWithChildren } from 'react';

import ModalTwo, { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import './Modal.scss';

interface Props extends ModalOwnProps {
    title?: string;
    subline?: string;
    className?: string;
    key?: string;
}

export const FullscreenModal = ({ title, subline, children, key, className, ...rest }: PropsWithChildren<Props>) => {
    return (
        <ModalTwo {...rest} className={clsx(className, 'bg-weak')} key={key} size="full" fullscreen>
            <>
                <ModalTwoHeader
                    title={title}
                    titleClassName="h2 mr-auto"
                    subline={subline && <p className="text-center mx-12">{subline}</p>}
                    closeButtonProps={{ shape: 'solid', className: 'shrink-0 rounded-full bg-norm' }}
                />

                {/* Content */}
                <div
                    className={clsx(
                        'pb-6 px-3 modal-two-content flex flex-column items-center justify-center grow overflow-auto'
                    )}
                >
                    <div
                        className="flex flex-column py-auto max-h-full w-full max-w-custom overflow-auto p-2 my-auto"
                        style={{ '--max-w-custom': '31rem' }}
                    >
                        {children}
                    </div>
                </div>
            </>
        </ModalTwo>
    );
};
