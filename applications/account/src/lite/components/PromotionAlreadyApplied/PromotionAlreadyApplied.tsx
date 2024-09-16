import { c } from 'ttag';

import { ProtonLogo } from '@proton/components';

import PublicFooter from '../../../app/components/PublicFooter';
import promotionApplied from './promotionApplied.svg';

const PromotionAlreadyApplied = () => {
    return (
        <div className="h-full overflow-auto flex justify-center">
            <div
                className="max-w-custom min-h-custom flex flex-column flex-nowrap"
                style={{ '--min-h-custom': '100vh', '--max-w-custom': '33.3rem' }}
            >
                <div className="flex-auto m-6">
                    <div className="flex justify-center">
                        <ProtonLogo />
                    </div>
                    <div className="my-16 text-center flex flex-column gap-6 p-11 border rounded-lg">
                        <img src={promotionApplied} alt="" />
                        <h1 className="text-bold text-2xl">
                            {c('Info').t`Your account was successfully updated with this promotion`}
                        </h1>
                        <div>
                            {c('Info')
                                .t`Thanks for supporting our mission to build a better internet where privacy and freedom come first.`}
                        </div>
                    </div>
                </div>

                <PublicFooter center={false} includeDescription className="m-6" />
            </div>
        </div>
    );
};

export default PromotionAlreadyApplied;
