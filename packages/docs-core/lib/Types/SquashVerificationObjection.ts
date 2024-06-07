export enum SquashVerificationObjectionDecision {
  AbortSquash = 'AbortSquash',
  ContinueSquash = 'ContinueSquash',
}

export type SquashVerificationObjectionCallback = () => Promise<SquashVerificationObjectionDecision>
