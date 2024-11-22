export type CreateValetTokenResponse = {
  Code: 1000
  ValetToken: {
    Token: string
    RtsApiUrl: string
    Preferences: [
      {
        Name: 'IncludeDocumentName'
        Value: boolean
      },
    ]
  }
}
