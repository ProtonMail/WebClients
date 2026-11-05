/** Mirrors `generateNodeUid` from Drive SDK. */
export function generateNodeUid(volumeId: string, nodeId: string): string {
  return `${volumeId}~${nodeId}`
}
