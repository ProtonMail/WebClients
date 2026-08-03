import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { PaperTrailStepper } from './PaperTrailStepper';

interface Props {
    step: 1 | 2;
    title: string;
    children: ReactNode;
    onBack: () => void;
    primaryLabel: string;
    onPrimary: () => void;
    primaryDisabled?: boolean;
}

export const PaperTrailWizardShell = ({
    step,
    title,
    children,
    onBack,
    primaryLabel,
    onPrimary,
    primaryDisabled = false,
}: Props) => {
    return (
        <div className="ai-paper-trail__inner ai-paper-trail__wizard-page">
            <div className="ai-paper-trail__wizard">
                <PaperTrailStepper activeStep={step} />
                <h1 className="ai-paper-trail__wizard-title">{title}</h1>
                {children}
                <div className="flex flex-nowrap justify-space-between">
                    <Button color="weak" pill onClick={onBack}>
                        {c('collider_2025:Action').t`Back`}
                    </Button>
                    <Button color="norm" pill onClick={onPrimary} disabled={primaryDisabled}>
                        {primaryLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};
