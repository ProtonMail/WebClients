export type AuthVersion = 0 | 1 | 2 | 3 | 4;

export interface AuthInfo {
    Version: number;
    Modulus: string;
    ServerEphemeral: string;
    Username?: string; // Only present if auth version < 3
    Salt: string;
}

export interface AuthCredentials {
    username?: string;
    password: string;
}
