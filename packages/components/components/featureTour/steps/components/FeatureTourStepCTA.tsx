import type { ReactNode } from 'react';

import { Button } from '@proton/atoms/Button/Button';

interface FeatureTourStepCTAProps {
    type: 'primary' | 'secondary';
    onClick: () => void;
    children: ReactNode;
}

const FeatureTourStepCTA = ({ type, onClick, children }: FeatureTourStepCTAProps) => {
    return (
        <Button color={type === 'primary' ? 'norm' : 'weak'} fullWidth onClick={onClick}>
            {children}
        </Button>
    );
};

export default FeatureTourStepCTA;
