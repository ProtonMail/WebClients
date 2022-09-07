import { OfferLayoutProps } from '../../interface';
import Deal from './Deal';
import DealCTA from './DealCTA';
import DealFeatures from './DealFeatures';
import DealPrice from './DealPrice';
import DealPriceInfos from './DealPriceInfos';
import DealTitle from './DealTitle';

const Deals = (props: OfferLayoutProps) => {
    return (
        <div className="offer-wrapper flex flex-nowrap flex-justify-space-around on-mobile-flex-column mt3">
            {props.offer.deals.map((deal, index) => (
                <Deal key={index} {...props} deal={deal}>
                    <DealTitle />
                    <DealPrice />
                    <DealCTA />
                    <div className="offer-features flex-item-fluid-auto w100 mb1">
                        <DealFeatures />
                    </div>
                    <DealPriceInfos />
                </Deal>
            ))}
        </div>
    );
};

export default Deals;
