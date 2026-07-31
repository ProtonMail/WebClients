export interface AlwaysOnPolicyArtifact {
    Filename: string;
    Content: string;
}

export interface AlwaysOnPolicyArtifacts {
    windows?: AlwaysOnPolicyArtifact;
    windowsUninstall?: AlwaysOnPolicyArtifact;
    rego?: AlwaysOnPolicyArtifact;
}

export interface AlwaysOnPolicy {
    ID: string;
    EnforceAlwaysOn: boolean;
    Version: number;
    Hash: string;
    UpdatedAt: number;
    CreatorUserID: string;
    Artifacts: AlwaysOnPolicyArtifacts;
}

export interface AlwaysOnPolicyResponse extends AlwaysOnPolicy {
    Code: number;
}

export interface UpdateAlwaysOnPolicyData {
    EnforceAlwaysOn: boolean;
}
