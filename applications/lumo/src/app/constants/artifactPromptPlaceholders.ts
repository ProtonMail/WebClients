import { c } from 'ttag';

/** Example prompts cycled in the composer placeholder while Create artifact mode is active. */
export const getArtifactPromptPlaceholders = (): string[] => {
    return [
        c('collider_2025:Artifact placeholder').t`Write a professional email declining a meeting`,
        c('collider_2025:Artifact placeholder').t`Write a Python script to dedupe a CSV by email`,
        c('collider_2025:Artifact placeholder').t`Create a self-contained HTML pomodoro timer`,
        c('collider_2025:Artifact placeholder').t`Create a 5-slide deck on password managers with a bar chart`,
    ];
};
