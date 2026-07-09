export const MSP_SUBSIDIARY_STATUS = {
    ON_HOLD: 0,
    ACTIVE: 1,
    DISABLED: 2,
} as const;

export type MspSubsidiaryStatusValue = (typeof MSP_SUBSIDIARY_STATUS)[keyof typeof MSP_SUBSIDIARY_STATUS];

export interface MspSubsidiary {
    ID: string;
    Name: string;
    Status: MspSubsidiaryStatusValue;
    MaxMembers: number;
    ActiveMembers: number;
    ParentOrgToken: string | undefined;
}
