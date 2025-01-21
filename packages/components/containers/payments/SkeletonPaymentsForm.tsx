import { c } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';

const SkeletonPaymentsForm = () => {
    return (
        <div>
            <div className="flex flex-column gap-6 mt-8">
                <SkeletonLoader width="100%" height="4em" index={0} />

                <div className="flex gap-4 flex-nowrap">
                    <SkeletonLoader width="100%" height="4em" index={1} />
                    <SkeletonLoader width="100%" height="4em" index={1} />
                </div>
            </div>

            <span className="sr-only">{c('Info').t`Loading`}</span>
        </div>
    );
};

export default SkeletonPaymentsForm;
