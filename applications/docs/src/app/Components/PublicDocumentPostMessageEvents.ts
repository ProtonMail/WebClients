/**
 * To copy a public document, the public context (the opener) will open a new window (the child/copier) to
 * something like docs.proton.x/?mode=copy. Once the child is ready to receive data from the opener, it will
 * post a CopierReady event. The opener will listen for this event and respond back with DataForCopying.
 *
 * The copier will receive this data and create a new document with this data.
 */
export enum PublicDocumentPostMessageEvent {
  CopierReady = 'public-copier-ready',
  DataForCopying = 'data-for-copying',
}

export type PublicDocumentPostMessageDataForCopying = {
  name: string
  yjsData: Uint8Array
}
