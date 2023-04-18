export interface Composer {
    ID: string;
    messageID: string;
}

export type ComposerID = string;

export interface ComposersState {
    composers: Record<ComposerID, Composer>;
}
