import type { ChallengeResult } from '@proton/components/containers/challenge/interface';

export interface ReservedAccount {
    username: string;
    domain: string;
    payload: ChallengeResult;
}

export interface FormData {
    parentEmail: string;
    reservedAccount: ReservedAccount | null;
    activationCode: string;
}

export enum Steps {
    Reservation = 1,
    ParentEmail = 2,
    Donation = 3,
    Confirmation = 4,
}

export const TOTAL_STEPS = 3;
