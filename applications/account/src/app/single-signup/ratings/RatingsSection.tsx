import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import cnet from './rating-logo-cnet.png';
import pceditor from './rating-logo-pceditor.png';
import techradar from './rating-logo-techradar.png';

const RatingsSection = ({ className }: { className?: string }) => {
    return (
        <div className={clsx('flex justify-space-around flex-nowrap gap-2', className)}>
            <div>
                <img
                    src={cnet}
                    alt={c('Info').t`CNET editors choice award with a rating of 8.4 out of 10`}
                    width="115"
                    height="86"
                />
            </div>
            <div>
                <img
                    src={pceditor}
                    alt={c('Info').t`PC Magazine editors choice award with a rating of 5 out of 5 stars`}
                    width="97"
                    height="86"
                />
            </div>
            <div>
                <img
                    src={techradar}
                    alt={c('Info').t`Tech radar pro recommended with a rating of 4.2 out of 5 stars`}
                    width="99"
                    height="85"
                />
            </div>
        </div>
    );
};

export default RatingsSection;
