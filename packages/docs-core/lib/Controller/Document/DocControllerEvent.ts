export enum DocControllerEvent {
  CommitVerificationFailed = 'CommitVerificationFailed',
}

export type CommitVerificationFailedPayload = {
  commitId: string
}
