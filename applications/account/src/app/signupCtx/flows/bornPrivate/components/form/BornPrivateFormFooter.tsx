import type { ReactNode } from 'react';

import { c } from 'ttag';

import Progress from '@proton/components/components/progress/Progress';
import clsx from '@proton/utils/clsx';

import { Steps } from '../../emailReservation/EmailReservationSignup';

interface FormFooterProps {
    step?: number;
    totalSteps?: number;
    stackedFullWidth?: boolean;
    children: ReactNode;
}

const BornPrivateFormFooter = ({ step, totalSteps, stackedFullWidth, children }: FormFooterProps) => {
    const showProgress = step !== undefined && totalSteps !== undefined;

    return (
        <div className={step === Steps.Donation ? 'my-8' : 'mt-8'}>
            {showProgress ? (
                <>
                    <div className="flex flex-column flex-nowrap mb-4">
                        <Progress className="progress-bar--norm mb-2" value={step} max={totalSteps} />
                        <p className="m-0 color-weak">
                            {
                                // translator: Step <current step>/<total number of steps>
                                c('Info').t`Step ${step}/${totalSteps}`
                            }
                        </p>
                    </div>
                    <div
                        className={clsx(
                            'flex gap-2 mt-8',
                            stackedFullWidth
                                ? 'flex-column-reverse w-full'
                                : 'flex-column-reverse md:flex-row items-center ml-auto justify-end'
                        )}
                    >
                        {children}
                    </div>
                </>
            ) : (
                <div className="flex flex-column-reverse md:flex-row gap-2 ml-auto justify-end">{children}</div>
            )}
        </div>
    );
};

export default BornPrivateFormFooter;
