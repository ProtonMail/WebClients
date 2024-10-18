import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import PublicFooter from './PublicFooter';
import PublicLayout from './PublicLayout';

interface EmailResubscribedProps {
    categories: ReactNode;
    onUnsubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailResubscribed = ({
    categories: categoriesJsx,
    onUnsubscribeClick,
    onManageClick,
    loading,
}: EmailResubscribedProps) => {
    return (
        <PublicLayout
            className="h-full"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div className="text-center">
                    {c('Email Unsubscribe').jt`You resubscribed to ${categoriesJsx} emails.`}
                </div>
            }
            footer={
                <>
                    <Button className="mb-1" fullWidth onClick={onUnsubscribeClick} loading={loading}>
                        {c('Email Unsubscribe').t`Unsubscribe`}
                    </Button>
                    <Button fullWidth onClick={onManageClick} shape="ghost" color="norm">
                        {c('Email Unsubscribe').t`Change other email subscriptions`}
                    </Button>
                </>
            }
            below={<PublicFooter />}
        />
    );
};

interface ConfirmEmailUnsubscribeProps {
    categories: ReactNode;
    onConfirmUnsubscribeClick: () => void;
    loading: boolean;
}

const ConfirmEmailUnsubscribe = ({ categories, loading, onConfirmUnsubscribeClick }: ConfirmEmailUnsubscribeProps) => {
    return (
        <PublicLayout
            className="h-full"
            header={c('Email Unsubscribe').t`Unsubscribe?`}
            main={
                <div className="text-center">
                    <div className="mb-2">{c('Email Unsubscribe').t`We're sorry to see you go.`}</div>
                    <div>
                        {c('Email Unsubscribe').jt`Click the button below to unsubscribe from ${categories} emails.`}
                    </div>
                </div>
            }
            footer={
                <>
                    <Button className="mb-1" fullWidth onClick={onConfirmUnsubscribeClick} loading={loading}>
                        {c('Email Unsubscribe').t`Unsubscribe`}
                    </Button>
                </>
            }
            below={<PublicFooter />}
        />
    );
};

interface EmailUnsubscribedProps {
    categories: ReactNode;
    onResubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailUnsubscribed = ({ categories, loading, onResubscribeClick, onManageClick }: EmailUnsubscribedProps) => {
    return (
        <PublicLayout
            className="h-full"
            header={c('Email Unsubscribe').jt`Thank you and goodbye`}
            main={
                <div className="text-center">
                    <div className="mb-2">
                        {c('Email Unsubscribe')
                            .jt`You unsubscribed from ${categories} emails, and will no longer receive this type of email from ${BRAND_NAME}.`}
                    </div>
                    <div>
                        {c('Email Unsubscribe').jt`If you unsubscribed by accident, you are welcome to resubscribe.`}
                    </div>
                </div>
            }
            footer={
                <>
                    <Button className="mb-1" fullWidth color="norm" onClick={onResubscribeClick} loading={loading}>
                        {c('Email Unsubscribe').t`Resubscribe`}
                    </Button>
                    <Button fullWidth onClick={onManageClick} shape="ghost" color="norm">
                        {c('Email Unsubscribe').t`Update email preferences`}
                    </Button>
                </>
            }
            below={<PublicFooter />}
        />
    );
};

interface EmailUnsubscribedContainerProps {
    categories: ReactNode;
    onUnsubscribeClick: () => Promise<void>;
    onResubscribeClick: () => Promise<void>;
    onManageClick: () => void;
}

export const EmailUnsubscribedContainer = ({
    categories: categoriesJsx,
    onUnsubscribeClick,
    onResubscribeClick,
    onManageClick,
}: EmailUnsubscribedContainerProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const [resubscribed, setResubscribed] = useState(false);
    const [loading, withLoading] = useLoading();

    if (resubscribed) {
        return (
            <EmailResubscribed
                categories={categoriesJsx}
                onUnsubscribeClick={() => {
                    withLoading(
                        onUnsubscribeClick()
                            .then(() => {
                                setResubscribed(false);
                            })
                            .catch(noop)
                    );
                }}
                onManageClick={onManageClick}
                loading={loading}
            />
        );
    }

    if (!confirmed) {
        return (
            <ConfirmEmailUnsubscribe
                categories={categoriesJsx}
                loading={loading}
                onConfirmUnsubscribeClick={() => {
                    withLoading(
                        onUnsubscribeClick()
                            .then(() => {
                                setConfirmed(true);
                            })
                            .catch(noop)
                    );
                }}
            />
        );
    }

    return (
        <EmailUnsubscribed
            categories={categoriesJsx}
            loading={loading}
            onResubscribeClick={() => {
                withLoading(
                    onResubscribeClick()
                        .then(() => {
                            setResubscribed(true);
                        })
                        .catch(noop)
                );
            }}
            onManageClick={onManageClick}
        />
    );
};
