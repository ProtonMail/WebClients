import { c } from 'ttag';

import { ProtonLogo } from '@proton/components/components';

import PublicFooter from '../../../app/components/PublicFooter';
import promotionApplied from './promotionApplied.svg';

const PromotionAlreadyApplied = () => {
    return (
        <div className="h-full bg-norm w-full flex flex-justify-center overflow-auto">
            <div className="max-w-custom m-6" style={{ '--max-w-custom': '30rem' }}>
                <div className="flex flex-justify-center">
                    <ProtonLogo />
                </div>
                <div className="my-16 text-center flex flex-column gap-6 flex-align-center p-11 border rounded-lg">
                    <img src={promotionApplied} alt="" />
                    <h1 className="text-bold text-2xl">
                        {c('Info').t`Your account was successfully updated with this promotion`}
                    </h1>
                    <div>
                        {c('Info')
                            .t`Thanks for supporting our mission to build a better internet where privacy and freedom come first.`}
                    </div>
                </div>
                <PublicFooter center={false} includeDescription />
            </div>
        </div>
    );
};

export default PromotionAlreadyApplied;
