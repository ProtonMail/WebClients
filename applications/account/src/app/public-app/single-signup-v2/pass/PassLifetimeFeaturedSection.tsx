import { c } from 'ttag';

import clubic from './logos/clubic.png';
import digitaltrends from './logos/digitaltrends.png';
import pcmag from './logos/pcmag.png';
import techradar from './logos/techradar.png';
import zdnet from './logos/zdnet.png';

interface Props {
    className?: string;
}

const PassLifetimeFeaturedSection = ({ className }: Props) => {
    const iconHeight = 2;

    const props = {
        className: 'max-h-custom',
        style: { '--max-h-custom': `${iconHeight}em` },
    };

    return (
        <div className={className}>
            <div className="text-center text-bold">{c('Info').t`Featured in`}</div>
            <div className="flex justify-space-around items-center flex-wrap gap-2 mt-2">
                <div>
                    <img src={pcmag} alt={c('Info').t`Featured in PC Magazine`} {...props} />
                </div>
                <div>
                    <img
                        src={zdnet}
                        alt={c('Info').t`Featured in ZDNet`}
                        {...props}
                        style={{ '--max-h-custom': `${iconHeight * 1.5}em` }}
                    />
                </div>
                <div>
                    <img src={digitaltrends} alt={c('Info').t`Featured in Digital Trends`} {...props} />
                </div>
                <div>
                    <img src={clubic} alt={c('Info').t`Featured in Clubic`} {...props} />
                </div>
                <div>
                    <img src={techradar} alt={c('Info').t`Featured in TechRadar`} {...props} />
                </div>
            </div>
        </div>
    );
};

export default PassLifetimeFeaturedSection;
