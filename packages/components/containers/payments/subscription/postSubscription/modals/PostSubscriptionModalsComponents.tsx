import { type ReactNode } from 'react';

import { Button } from '@proton/atoms';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import checkoutLoader from '@proton/styles/assets/img/post-subscription/checkout-loader.svg';
import clsx from '@proton/utils/clsx';

export const PostSubscriptionModalWrapper = ({
    children,
    canClose,
    ...modalProps
}: { children: ReactNode; canClose: boolean } & ModalStateProps) => (
    <Modal
        {...modalProps}
        onClose={() => {
            if (canClose) {
                modalProps.onClose();
            }
        }}
        className="modal-two--twocolors"
    >
        {children}
    </Modal>
);

export const PostSubscriptionModalHeader = ({ illustration }: { illustration: string }) => (
    <>
        <ModalHeader />
        <div className="modal-two-illustration-container relative text-center fade-in-up">
            <img src={illustration} alt="" width="128" height="128" />
        </div>
    </>
);

export const PostSubscriptionModalContentWrapper = ({ children }: { children: ReactNode }) => (
    <div className="modal-two-content-container fade-in-up">
        <ModalContent>
            <div>
                <div className="mt-8 mb-6">{children}</div>
            </div>
        </ModalContent>
    </div>
);

interface ConfirmationModalContentProps {
    description: string;
    illustration: string;
    primaryButtonCallback: () => void;
    primaryButtonText: string;
    secondaryButtonCallback: () => void;
    secondaryButtonText: string;
    subtitle?: string;
    title: string;
}

export const PostSubscriptionModalContent = ({
    description,
    illustration,
    primaryButtonCallback,
    primaryButtonText,
    secondaryButtonCallback,
    secondaryButtonText,
    subtitle,
    title,
}: ConfirmationModalContentProps) => (
    <>
        <PostSubscriptionModalHeader illustration={illustration} />
        <PostSubscriptionModalContentWrapper>
            <div className="flex items-center min-h-custom" style={{ '--min-h-custom': '10rem' }}>
                <div>
                    <h1 className={clsx('text-bold text-center', subtitle ? 'text-lg mb-1' : 'text-3xl mb-2')}>
                        {title}
                    </h1>
                    {!!subtitle && <h2 className="text-lg text-center mt-0 mb-2">{subtitle}</h2>}
                    <p className="text-center m-0 color-weak">{description}</p>
                </div>
            </div>
            <div className="mt-6">
                <Button className="mb-2" color="norm" fullWidth onClick={primaryButtonCallback}>
                    {primaryButtonText}
                </Button>
                <Button fullWidth onClick={secondaryButtonCallback}>
                    {secondaryButtonText}
                </Button>
            </div>
        </PostSubscriptionModalContentWrapper>
    </>
);

export const PostSubscriptionModalLoadingContent = ({
    title,
    height = 'medium',
}: {
    title: string;
    height?: 'medium' | 'high';
}) => (
    <ModalContent
        className="m-8 text-center min-h-custom flex items-center justify-center"
        style={{ '--min-h-custom': height === 'medium' ? '27rem' : '35rem' }}
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
    </ModalContent>
);
