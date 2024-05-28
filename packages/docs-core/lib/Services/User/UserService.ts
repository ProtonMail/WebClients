import { UserModel } from '@proton/shared/lib/interfaces'
import { UserServiceInterface } from './UserServiceInterface'

export class UserService implements UserServiceInterface {
  private userId: string

  constructor(public user: UserModel) {
    this.userId = user.Email
  }

  getUserId(): string {
    return this.userId
  }
}
