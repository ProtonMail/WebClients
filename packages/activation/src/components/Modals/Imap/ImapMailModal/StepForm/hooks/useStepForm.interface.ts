export type StepFormState = {
    emailAddress: string;
    password: string;
    imap: string;
    port: string;
};

export type StepFormErrors = Partial<Record<keyof StepFormState, string>>;
export type StepFormBlur = Partial<Record<keyof StepFormState, boolean>>;
