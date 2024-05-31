export class DecryptedMessage {
  public content: Uint8Array
  public signature: Uint8Array
  public authorAddress: string
  public aad: string
  public timestamp: number

  constructor(dto: {
    content: Uint8Array
    signature: Uint8Array
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
}
