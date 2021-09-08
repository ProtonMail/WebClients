export type ChallengeLogType = 'message' | 'error' | 'step';

export interface ChallengeLog {
    type: ChallengeLogType;
    text: string;
    data?: unknown;
}

export type ChallengeResult = { [key: string]: string } | undefined;

export interface ChallengeRef {
    focus: (selector: string) => void;
    getChallenge: () => Promise<ChallengeResult>;
}
