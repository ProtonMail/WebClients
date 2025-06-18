import { useMemo } from 'react';

import { c } from 'ttag';

import { Kbd, Tooltip } from '@proton/atoms';
import { AutotypeKeyboardShortcut } from '@proton/pass/components/Item/Autotype/AutotypeKeyboardShortcut';
import { type Item } from '@proton/pass/types';
import type { AutotypeAction } from '@proton/pass/types/desktop/autotype';
import { AutotypeKey } from '@proton/pass/types/desktop/autotype';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const useAutotypeActions = (data: Item<'login'>) => {
    const hasPassword = Boolean(data.content.password.v);
    const hasUsername = Boolean(data.content.itemUsername.v);
    const hasEmail = Boolean(data.content.itemEmail.v);

    const tabKey = <Kbd shortcut={c('Keyboard key').t`TAB`} />;
    const enterKey = <Kbd shortcut={c('Keyboard key').t`ENTER`} />;
    const usernameKey = <Kbd shortcut={c('Label').t`USERNAME`} />;
    const emailKey = <Kbd shortcut={c('Label').t`EMAIL`} />;
    const passwordKey = <Kbd shortcut={c('Label').t`PASSWORD`} />;

    const actions: AutotypeAction[] = [
        ...(hasUsername && hasPassword
            ? [
                  {
                      key: AutotypeKey.USERNAME_TAB_PASSWORD_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      title: (
                          <div>
                              {usernameKey} {tabKey} {passwordKey} {enterKey}
                          </div>
                      ),
                      icon: 'pass-passkey',
                  } as const,
                  {
                      key: AutotypeKey.USERNAME_TAB_PASSWORD,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                      }),
                      title: (
                          <div>
                              {usernameKey} {tabKey} {passwordKey}
                          </div>
                      ),
                      icon: 'pass-passkey',
                  } as const,
              ]
            : []),
        ...(hasEmail && hasPassword
            ? [
                  {
                      key: AutotypeKey.EMAIL_TAB_PASSWORD_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail), deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      title: (
                          <div>
                              {emailKey} {tabKey} {passwordKey} {enterKey}
                          </div>
                      ),
                      icon: 'pass-passkey',
                  } as const,
                  {
                      key: AutotypeKey.EMAIL_TAB_PASSWORD,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail), deobfuscate(data.content.password)],
                      }),
                      title: (
                          <div>
                              {emailKey} {tabKey} {passwordKey}
                          </div>
                      ),
                      icon: 'pass-passkey',
                  } as const,
              ]
            : []),
        ...(hasUsername
            ? [
                  {
                      key: AutotypeKey.USERNAME_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername)],
                          enterAtTheEnd: true,
                      }),
                      title: (
                          <div>
                              {usernameKey} {enterKey}
                          </div>
                      ),
                      icon: 'user',
                  } as const,
              ]
            : []),
        ...(hasEmail
            ? [
                  {
                      key: AutotypeKey.EMAIL_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail)],
                          enterAtTheEnd: true,
                      }),
                      title: (
                          <div>
                              {emailKey} {enterKey}
                          </div>
                      ),
                      icon: 'envelope',
                  } as const,
              ]
            : []),
        ...(hasPassword
            ? [
                  {
                      key: AutotypeKey.PASSWORD_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      title: (
                          <div>
                              {passwordKey} {enterKey}
                          </div>
                      ),
                      icon: 'key',
                  } as const,
              ]
            : []),
    ].map((action, index) =>
        index === 0
            ? {
                  ...action,
                  subtitle: (
                      <Tooltip
                          title={c('Info')
                              .t`Keyboard shortcut can only be used while inside ${PASS_APP_NAME} desktop app and viewing a login item`}
                          openDelay={500}
                          originalPlacement="bottom"
                      >
                          <div className="mt-2 flex align-center gap-1">
                              {c('Label').t`Keyboard shortcut:`} <AutotypeKeyboardShortcut />
                          </div>
                      </Tooltip>
                  ),
              }
            : action
    );

    return useMemo(() => ({ actions }), [data]);
};
