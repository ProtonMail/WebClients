export interface IncomingEphemeral {
    [key: string]: boolean | undefined;
}

export type OutgoingEphemeralKeys = 'recover' | 'recover-token' | 'enable';
export interface OutgoingEphemeral {
    [key: `${string}-${OutgoingEphemeralKeys}`]: boolean | undefined;
}
