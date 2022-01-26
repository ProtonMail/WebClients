type OwnershipChallengeType = 'external' | 'login';

export interface OwnershipVerificationModel {
    description: string;
    method: `ownership-${'sms' | 'email'}`;
    type: OwnershipChallengeType;
    value: string;
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
    promise: Promise<[VerificationDataResult, null]>;
    result: OwnershipVerificationModel;
}

export interface OwnershipCache {
    'ownership-email': Partial<OwnershipMethodCache>;
    'ownership-sms': Partial<OwnershipMethodCache>;
}

export enum HumanVerificationSteps {
    ENTER_DESTINATION,
    VERIFY_CODE,
    INVALID_CODE,
}

export type CaptchaTheme = 'light' | 'dark';
