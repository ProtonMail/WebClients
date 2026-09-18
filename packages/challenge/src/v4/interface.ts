import type { ChallengeResult } from '../shared/interface';

export type { ChallengeLog, ChallengeLogType, ChallengeResult } from '../shared/interface';

export interface ChallengeRef {
    focus: (selector: string) => void;
    getChallenge: () => Promise<ChallengeResult>;
}
