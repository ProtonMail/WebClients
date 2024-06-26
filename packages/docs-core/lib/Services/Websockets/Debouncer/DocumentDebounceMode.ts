export enum DocumentDebounceMode {
  /** Realtime mode means multiple people are in the document and changes should be propagated as soon as possible */
  Realtime = 'Realtime',
  /** In singleplayer, the user is alone in the doc and we don't have to be as fast in saving */
  SinglePlayer = 'SinglePlayer',
}
