export interface TestUserModel {
    id: string;
    email: string;
    displayName?: string;
    roles?: string[];
    subscription?: string[];
}

export interface TestOrganizationExtended {
    id: string;
    name: string;
    slug?: string;
    features?: string[];
}
