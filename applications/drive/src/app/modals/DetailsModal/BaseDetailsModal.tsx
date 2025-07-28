import React from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants, Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import ModalContentLoader from '../../components/modals/ModalContentLoader';

export type BaseDetailsModalProps<T> = {
    isLoading: boolean;
    title: string;
    hasError: boolean;
    details?: T;
    DetailsComponent: React.ComponentType<{ details: T }>;
};

export function BaseDetailsModal<T>({
    onClose,
    isLoading,
    title,
    hasError,
    details,
    DetailsComponent,
    ...modalProps
}: BaseDetailsModalProps<T> & ModalStateProps) {
    const renderModalState = () => {
        if (isLoading) {
            return <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>;
        }

        if (hasError || !details) {
            return (
                <ModalTwoContent>
                    <Banner variant={BannerVariants.DANGER}>{c('Error')
                        .t`Failed to get details, please try again later`}</Banner>
                </ModalTwoContent>
            );
        }

        return <DetailsComponent details={details} />;
    };

    return (
        <ModalTwo onClose={onClose} size="large" {...modalProps}>
            <ModalTwoHeader title={title} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
