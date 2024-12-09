export enum IDP_TYPE {
    DEFAULT = 1,
    EDUGAIN = 2,
}

export interface SSO {
    ID: string;
    SSOURL: string;
    SSOEntityID: string;
    Certificate: string;
    DomainID: string;
    SCIMOauthClientID: string | null;
    Flags: number;
    Type: IDP_TYPE;
    EdugainAffiliations: EdugainAffiliations[];
}

// We don't want to show "member", users have to select Student, Faculty and Staff manually
export enum EdugainAffiliations {
    STUDENT = 'student',
    FACULTY = 'faculty',
    STAFF = 'staff',
    ALUM = 'alum',
    AFFILIATE = 'affiliate',
    EMPLOYEE = 'employee',
    LIBRARY_WALK_IN = 'library-walk-in',
}

export interface EduGainOrganization {
    EntityId: string;
    Name: string;
}
