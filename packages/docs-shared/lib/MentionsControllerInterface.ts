export interface MentionsControllerInterface {
  mentionableUsers: string[]
  sendMentionNotification(mentionedUser: string): void
  searchMentionableUsers(query: string): string[]
  getMentionsFromContent(content: string): string[]
}
