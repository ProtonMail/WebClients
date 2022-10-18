import { OfferLayoutProps, OfferProps } from '../interface';

const hasOffer = (props: OfferLayoutProps): props is OfferProps => {
    return !!props.offer;
};

export default hasOffer;
