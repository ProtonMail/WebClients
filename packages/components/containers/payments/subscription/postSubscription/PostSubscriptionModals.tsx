import { type ReactNode } from 'react';

import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import checkoutLoader from '@proton/styles/assets/img/post-subscription/checkout-loader.svg';

export const PostSubscriptionModalWrapper = ({
    children,
    canClose,
    ...modalProps
}: { children: ReactNode; canClose: boolean } & ModalStateProps) => (
    <ModalTwo
        {...modalProps}
        onClose={() => {
            if (canClose) {
                modalProps.onClose();
            }
        }}
        className="modal-two--twocolors"
    >
        {children}
    </ModalTwo>
);

export const PostSubscriptionLoadingModalContent = ({ title }: { title: string }) => (
    <ModalTwoContent
        className="m-8 text-center min-h-custom flex items-center justify-center"
        style={{ '--min-h-custom': '32rem' }}
    >
        <div>
            <div className="mb-4">
                <img
                    src={checkoutLoader}
                    className="rounded-50 max-w-custom"
                    style={{
                        '--max-w-custom': '10rem',
                    }}
                    alt=""
                />
            </div>
            <p className="m-0 color-weak">{title}</p>
        </div>
    </ModalTwoContent>
);
