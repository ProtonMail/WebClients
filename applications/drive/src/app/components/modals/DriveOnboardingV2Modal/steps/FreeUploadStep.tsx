import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { Container } from '../Container';
import type { OnboardingProps } from '../interface';
import tenMinuteUpload from './freeUpload.svg';

export function FreeUploadStep() {
    return (
        <Container
            subtitle={c('Title').t`Welcome offer`.toUpperCase()}
            title={c('Title').t`Get started with 10 minutes of free uploads, on the house.`}
            image={tenMinuteUpload}
        >
            <p className="text-lg">{c('Onboarding Info')
                .t`Files uploaded during this time won’t count towards your storage limit.`}</p>
        </Container>
    );
}

export function FreeUploadStepButtons({ onNext }: OnboardingProps) {
    return (
        <div className="w-full flex justify-end">
            <Button color="norm" onClick={onNext}>
                {c('Onboarding Action').t`Get started`}
            </Button>
        </div>
    );
}
