export interface ConnectionReadyPayload {
  connectionId: string
  clientUpgradeRecommended: boolean
  clientUpgradeRequired: boolean
}
