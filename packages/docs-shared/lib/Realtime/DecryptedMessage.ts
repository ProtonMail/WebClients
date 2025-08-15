export class DecryptedMessage {
  public content: Uint8Array<ArrayBuffer>
  public signature: Uint8Array<ArrayBuffer>
  public authorAddress: string
  public aad: string
  public timestamp: number

  constructor(dto: {
    content: Uint8Array<ArrayBuffer>
    signature: Uint8Array<ArrayBuffer>
    authorAddress: string
    aad: string
    timestamp: number
  }) {
    this.content = dto.content
    this.signature = dto.signature
    this.authorAddress = dto.authorAddress
    this.aad = dto.aad
    this.timestamp = dto.timestamp
  }

  byteSize(): number {
    return this.content.byteLength + this.signature.byteLength + this.authorAddress.length + this.aad.length
  }
}
