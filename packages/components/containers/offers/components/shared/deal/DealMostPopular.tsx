import { useDealContext } from './DealContext';

const DealMostPopular = () => {
    const {
        deal: { header },
    } = useDealContext();

    return (
        <div className="text-center offer-most-popular mt1 text-sm text-semibold">
            {header && <span className="text-uppercase color-primary">{header()}</span>}
        </div>
    );
};

export default DealMostPopular;
