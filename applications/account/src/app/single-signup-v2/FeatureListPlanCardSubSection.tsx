import { ReactNode } from 'react';

const FeatureListPlanCardSubSection = ({ description, features }: { description: ReactNode; features: ReactNode }) => {
    return (
        <div className="flex flex-column gap-4 px-2">
            <div className="text-center">{description}</div>
            {features}
        </div>
    );
};

export default FeatureListPlanCardSubSection;
