import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';

interface Props {
    onUpdateEmail: () => void;
    loading?: boolean;
    className?: string;
}

export const InvoiceEmailBouncedBanner = ({ onUpdateEmail, loading, className }: Props) => {
    return (
        <Banner
            className={className}
            variant={BannerVariants.NORM}
            data-testid="invoiceEmailBouncedBanner"
            action={
                <Button onClick={onUpdateEmail} loading={loading} data-testid="updateInvoiceEmail">
                    {c('Action').t`Update email`}
                </Button>
            }
        >
            {c('Info')
                .t`We couldn't send invoices to your email address. Automatic invoicing has been paused until you update the address.`}
        </Banner>
    );
};
