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

export enum BreadcrumbRenderingMode {
    Inline = 0, // Part of the page, regular fonts and padding
    Prominent = 1, // Rendered as a top level title e.g. bigger fonts, more padding
}

export interface BreadcrumbRenderingConfig {
    renderingMode: BreadcrumbRenderingMode;
}
