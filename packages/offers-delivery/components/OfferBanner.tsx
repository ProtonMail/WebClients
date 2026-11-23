import { Button } from '@proton/atoms/Button/Button';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';

import type { OfferSurfaceProps } from './OfferSurface';

export const OfferBanner = ({ offer }: OfferSurfaceProps) => {
    const { campaign, onAction, onDismiss, seenRef } = offer;
    const { message, cta } = campaign;

    /* `announce={false}`: role="alert" is a live region that interrupts screen
     * reader output. Session recovery and unpaid invoices earn that; a promotion
     * does not. */
    return (
        <TopBanner className="bg-primary" onClose={onDismiss} announce={false} data-testid="offer-banner">
            <div ref={seenRef} className="flex flex-wrap items-center justify-center gap-3">
                <p className="m-0">
                    {message.title && (
                        <span className="text-bold" data-testid="offer-banner:title">
                            {message.title}
                        </span>
                    )}{' '}
                    {message.body && (
                        <span className="text-normal" data-testid="offer-banner:body">
                            {message.body}
                        </span>
                    )}
                </p>

                {cta && (
                    <Button
                        className="shrink-0"
                        shape="outline"
                        size="small"
                        pill
                        onClick={onAction}
                        data-testid="offer-banner:cta"
                    >
                        {cta.text}
                    </Button>
                )}
            </div>
        </TopBanner>
    );
};
