export interface TestUserModel {
    id: string;
    email: string;
    displayName?: string;
    roles?: string[];
    subscription?: string[];
}
