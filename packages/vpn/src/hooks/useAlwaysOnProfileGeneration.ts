import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useAlwaysOnPolicyService } from '../contexts/AlwaysOnPolicyServiceContext';
import type { AlwaysOnPolicy } from '../types/AlwaysOn';
import { useAlwaysOnPolicyTelemetry } from './useAlwaysOnPolicyTelemetry';

type Step = 'form' | 'generating' | 'generated' | 'instructions';

/** Minimum time the spinner stays on screen, so a near-instant API response doesn't flash it. */
const GENERATING_DURATION_MS = 800;

/** How long the success checkmark stays before the modal morphs into the deployment instructions. */
const SUCCESS_HOLD_MS = 1200;

/**
 * Drives the `form → generating → generated → instructions` flow. Once generation succeeds the modal
 * holds the success state briefly, then advances to the deployment instructions in place (no
 * close/reopen). The generated policy is held in `createdPolicy` so the caller can commit it on exit.
 */
export const useProfileGeneration = () => {
    const service = useAlwaysOnPolicyService();
    const { createNotification } = useNotifications();
    const {
        sendGenerateStartReport,
        sendGenerateSuccessReport,
        sendGenerateFailureReport,
        sendInstructionsViewedReport,
    } = useAlwaysOnPolicyTelemetry();
    const [step, setStep] = useState<Step>('form');
    const [createdPolicy, setCreatedPolicy] = useState<AlwaysOnPolicy | null>(null);

    useEffect(() => {
        if (step !== 'generated') {
            return;
        }
        const timeout = setTimeout(() => setStep('instructions'), SUCCESS_HOLD_MS);
        return () => clearTimeout(timeout);
    }, [step]);

    useEffect(() => {
        if (step === 'instructions') {
            sendInstructionsViewedReport();
        }
    }, [step, sendInstructionsViewedReport]);

    const generate = async () => {
        setStep('generating');
        sendGenerateStartReport();
        try {
            const [policy] = await Promise.all([
                service.updatePolicy({ EnforceAlwaysOn: true }),
                wait(GENERATING_DURATION_MS),
            ]);
            setCreatedPolicy(policy);
            setStep('generated');
            sendGenerateSuccessReport();
        } catch {
            createNotification({
                type: 'error',
                text: c('Error').t`Could not generate the device profile. Please try again.`,
            });
            setStep('form');
            sendGenerateFailureReport();
        }
    };

    const reset = () => {
        setStep('form');
        setCreatedPolicy(null);
    };

    return {
        step,
        isForm: step === 'form',
        isCreated: step === 'generated',
        isInstructions: step === 'instructions',
        createdPolicy,
        generate,
        reset,
    };
};
