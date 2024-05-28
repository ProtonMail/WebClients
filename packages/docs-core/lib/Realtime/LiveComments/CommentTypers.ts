export class CommentTypers {
  private users: string[] = []

  constructor(public readonly threadId: string) {
    this.threadId = threadId
  }

  public addUser(userId: string): void {
    this.users.push(userId)
  }

  public removeUser(userId: string): void {
    this.users = this.users.filter((user) => user !== userId)
  }

  public getUsers(): string[] {
    return this.users
  }

  public isUserTyping(userId: string): boolean {
    return this.users.includes(userId)
  }
}
