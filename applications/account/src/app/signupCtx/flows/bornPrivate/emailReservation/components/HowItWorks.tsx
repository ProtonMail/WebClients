import { c } from 'ttag';

import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const HowItWorks = () => {
    const getSteps = () => [
        c('Label').t`Choose an address to reserve for your child`,
        c('Label').t`Enter your email address`,
        c('Label').t`Donate $1 or more to the ${BRAND_NAME} Foundation`,
    ];

    return (
        <div className="pb-1">
            <p className="text-semibold my-0">{c('Info').t`How it works`}</p>
            <ol className="unstyled flex flex-column flex-nowrap gap-4 mt-3 mb-3">
                {getSteps().map((step, index) => (
                    <li key={index} className="flex flex-row items-top flex-nowrap gap-2">
                        <CircledNumber number={index + 1} textSizeClassName="text-sm" aria-hidden="true" />
                        <span className="color-weak flex-1">{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default HowItWorks;
