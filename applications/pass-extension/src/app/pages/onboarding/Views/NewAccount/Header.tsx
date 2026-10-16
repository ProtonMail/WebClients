import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { ImportIcon } from '@proton/pass/components/Import/ImportIcon';
import { Stepper } from '@proton/pass/components/Onboarding/UI/Stepper';
import { type ImportProvider, PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';

type ImportStep = 'providers' | 'export' | 'upload';

const IMPORT_STEP_INDEX: Record<ImportStep, number> = { providers: 0, export: 1, upload: 2 };

type ImportStepperProps = { step: ImportStep; provider?: ImportProvider };

const ImportStepper: FC<ImportStepperProps> = ({ step, provider }) => (
    <Stepper
        className="w-full mt-4 text-semibold text-lg"
        active={IMPORT_STEP_INDEX[step]}
        steps={[
            <>
                {step === 'providers' || !provider ? (
                    c('Title').t`Select your password manager`
                ) : (
                    <div className="flex flex-row gap-2 items-center">
                        <ImportIcon
                            provider={provider}
                            className="w-custom"
                            style={{ '--w-custom': '2rem', marginBlock: '-2rem' }}
                        />
                        {PROVIDER_INFO_MAP[provider].title}
                    </div>
                )}
            </>,
            c('Title').t`Export`,
            c('Title').t`Upload`,
        ]}
        hrefs={[
            step !== 'providers' ? '#/import' : undefined,
            step === 'upload' ? `#/import/${provider}` : undefined,
            step === 'export' ? `#/import/${provider}/upload` : undefined,
        ]}
    />
);

type Props = {
    title: ReactNode;
    subtitle?: ReactNode;
    stepper?: ImportStepperProps;
};

export const Header: FC<Props> = ({ title, subtitle, stepper }) => (
    <div className="flex flex-column gap-2 w-full items-center">
        <h2 className="text-bold">{title}</h2>
        {subtitle && <h3 className="mt-2 w-1/2 text-center">{subtitle}</h3>}
        {stepper && <ImportStepper {...stepper} />}
    </div>
);
