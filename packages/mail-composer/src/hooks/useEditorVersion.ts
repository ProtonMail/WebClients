import { useFlag } from '@proton/unleash/useFlag';

export const EDITOR_VERSIONS = ['roosterjs-8', 'roosterjs-9'] as const;

export type EditorVersion = (typeof EDITOR_VERSIONS)[number];

/**
 * The roosterjs version a composer editor starts on, reported with composer errors and telemetry
 * so the two versions can be compared while MailComposerRoosterV9 rolls out
 */
export const useEditorVersion = (): EditorVersion => {
    return useFlag('MailComposerRoosterV9') ? 'roosterjs-9' : 'roosterjs-8';
};
