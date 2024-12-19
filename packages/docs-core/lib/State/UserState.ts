import { BasePropertiesState } from '@proton/docs-shared'

export type UserEvent = { name: string; payload: unknown }

export interface UserStateValues {
  userAccountEmailDocTitleEnabled: boolean
  userAccountEmailNotificationsEnabled: boolean
}

const DefaultValues: UserStateValues = {
  userAccountEmailDocTitleEnabled: false,
  userAccountEmailNotificationsEnabled: false,
}

/**
 * Manages the state of a user
 */
export class UserState extends BasePropertiesState<UserStateValues, UserEvent> {
  constructor() {
    super(DefaultValues)
  }
}
