import type { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

type OwnershipChallengeType = 'external' | 'login' | 'verify_address';

export interface OwnershipVerificationModel {
    description: string;
    method: `ownership-${'sms' | 'email'}`;
    type: OwnershipChallengeType;
    value: string;
}

export interface HumanVerificationResult {
    tokenType: HumanVerificationMethodType;
    token: string;
    verificationModel?: VerificationModel;
}

export type VerificationModel =
    | {
          method: 'sms';
          value: string;
      }
    | {
          method: 'email';
          value: string;
      }
    | OwnershipVerificationModel;

export interface VerificationDataResult {
    ChallengeType: OwnershipChallengeType;
    ChallengeText: string;
    ChallengeDestination: string;
}

export interface VerificationTokenResult {
    Token: string;
}

export interface OwnershipMethodCache {
    promise: Promise<VerificationDataResult>;
    result: OwnershipVerificationModel;
}

export interface OwnershipCache {
    'ownership-email': Partial<OwnershipMethodCache>;
    'ownership-sms': Partial<OwnershipMethodCache>;
}

export enum HumanVerificationSteps {
    ENTER_DESTINATION = 0,
    VERIFY_CODE = 1,
    INVALID_CODE = 2,
    SUCCESSFUL_CODE = 3,
}

export type CaptchaTheme = 'light' | 'dark';
