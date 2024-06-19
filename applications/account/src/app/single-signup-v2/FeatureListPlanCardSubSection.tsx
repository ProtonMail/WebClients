import { ReactNode } from 'react';

const FeatureListPlanCardSubSection = ({ description, features }: { description: ReactNode; features: ReactNode }) => {
    return (
        <div className="flex flex-column gap-4">
            <div className="text-left text-sm">{description}</div>
            {features}
        </div>
    );
};

export default FeatureListPlanCardSubSection;
