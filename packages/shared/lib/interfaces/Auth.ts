export interface AuthModulus {
    Modulus: string;
    ModulusID: string;
}

export interface Auth2FA {
    Enabled: number; // 0 for disabled, 1 for OTP, 2 for U2F, 3 for both
    U2F: {
        Challenge: string;
        RegisteredKeys: [
            {
                Version: string;
                KeyHandle: string;
            }
        ];
    };
}

export interface AuthInfo {
    Modulus: string;
    ServerEphemeral: string;
    Version: number;
    Salt: string;
    SRPSession: string;
    '2FA'?: Auth2FA; // Only returned if already authenticated
}
