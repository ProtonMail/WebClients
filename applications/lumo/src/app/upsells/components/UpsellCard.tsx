import lumoSad from '@proton/styles/assets/img/lumo/lumo-cat-sad.svg';


import './UpsellCard.scss';
import type {TierError} from "../../redux/slices/meta/errors";
import LumoTierErrorUpsellButtons from "../composed/LumoTierErrorUpsellButtons";

const UpsellCardWrapper = ({
    children,
    error,
    showSadCat = true,
}: {
    children: React.ReactNode;
    error: TierError;
    showSadCat?: boolean;
}) => {
    return (
        <div className="upsell-card flex flex-nowrap flex-column lg:flex-row gap-4 lg:gap-2 p-3 rounded-xl mb-4 w-full">
            {showSadCat && (
                <div className="flex flex-col lg:flex-row items-center mr-1 shrink-0">
                    <img
                        className="w-custom h-custom mx-auto"
                        src={lumoSad}
                        alt=""
                        style={{ '--w-custom': '3.125rem', '--h-custom': '3.125rem' }}
                    />
                </div>
            )}
            <div className="flex flex-column flex-nowrap gap-2 lg:flex-1">
                <p className="error-card-title text-bold m-0">{error.errorTitle}</p>
                <p className="error-card-message m-0">{error.errorMessage}</p>
            </div>
            <div className="flex flex-column flex-nowrap gap-2 my-auto">{children}</div>
        </div>
    );
};

UpsellCardWrapper.displayName = 'UpsellCardWrapper';

const UpsellCard = ({ error, showSadCat = true }: { error: TierError; showSadCat?: boolean }) => {
    return (
        <UpsellCardWrapper error={error} showSadCat={showSadCat}>
            <LumoTierErrorUpsellButtons />
        </UpsellCardWrapper>
    );
};

UpsellCard.displayName = 'UpsellCard';

export default UpsellCard;
