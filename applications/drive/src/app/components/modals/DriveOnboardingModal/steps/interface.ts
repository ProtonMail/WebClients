import type { OnboardingStepRenderCallback } from '@proton/components';

export type StepProps<Props = {}> = OnboardingStepRenderCallback & Props;
