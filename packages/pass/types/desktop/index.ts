export type ContextBridgeApi = {
    writeToClipboard: (text: string) => Promise<void>;
    navigate: (href: string) => Promise<void>;
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<boolean>;
    getDecryptionKey: (challenge: string) => Promise<Buffer | null>;
    getSecret: (key: string) => Promise<string>;
    setSecret: (key: string, data: string) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;
};
