import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';

export type StepProps<Props = {}> = OnboardingStepRenderCallback & Props;
