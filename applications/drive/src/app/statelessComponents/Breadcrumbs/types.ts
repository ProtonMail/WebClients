export interface BreadcrumbsEvents {
    onBreadcrumbItemClick: (nodeUid: string) => void;
}

export interface CrumbDefinition {
    uid: string;
    name: string;
    haveSignatureIssues: boolean;
    // Custom per-crumb on click listener to override
    // the default onBreadcrumbItemClick.
    customOnItemClick?: () => void;
    supportDropOperations: boolean;
}
