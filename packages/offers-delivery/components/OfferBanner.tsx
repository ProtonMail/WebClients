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
        <TopBanner onClose={onDismiss} announce={false} data-testid="offer-banner">
            <div ref={seenRef}>
                {message.imageUrl && (
                    <img
                        className="max-w-full max-h-custom pointer-events-none user-select-none object-contain"
                        style={{ '--max-h-custom': '4rem' }}
                        src={message.imageUrl}
                        referrerPolicy="no-referrer"
                        alt=""
                    />
                )}

                <h2 className="text-lg text-bold m-0">{message.title}</h2>
                <div className="lh120 color-weak" data-testid="offer-banner:body">
                    {message.body}
                </div>

                {cta && (
                    <Button
                        className="text-ellipsis mt-1"
                        color="norm"
                        shape="solid"
                        size="small"
                        pill
                        fullWidth
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
