import type { useElementActions } from './hooks/useElementActions';
import type { useRouterNavigation } from './hooks/useRouterNavigation';

export type RouterNavigation = ReturnType<typeof useRouterNavigation>;
export type MailboxActions = ReturnType<typeof useElementActions>;
