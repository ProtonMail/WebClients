import { type FC } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { AutotypeDropdown, type AutotypeDropdownActions } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import type { Item } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
};

export const AutotypeDropdownLogin: FC<AutotypeDropdownLoginProps> = ({ data }) => {
    const hasPassword = Boolean(data.content.password.v);
    const hasUsername = Boolean(data.content.itemUsername.v);
    const hasEmail = Boolean(data.content.itemEmail.v);
    const hasUsernameAndPassword = hasUsername && hasPassword;
    const hasEmailAndPassword = hasEmail && hasPassword;

    if (!(hasUsername || hasEmail || hasPassword)) return null;

    const tabKey = <Kbd shortcut={c('Keyboard key').t`TAB`} />;
    const enterKey = <Kbd shortcut={c('Keyboard key').t`ENTER`} />;
    const usernameKey = <Kbd shortcut={c('Label').t`USERNAME`} />;
    const emailKey = <Kbd shortcut={c('Label').t`EMAIL`} />;
    const passwordKey = <Kbd shortcut={c('Label').t`PASSWORD`} />;

    const autotypeActions: AutotypeDropdownActions[] = [
        ...(hasUsernameAndPassword
            ? ([
                  {
                      title: (
                          <div>
                              {usernameKey} {tabKey} {passwordKey} {enterKey}
                          </div>
                      ),
                      key: 'autotype-option-username-tab-password-enter',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      icon: 'pass-passkey',
                  },
                  {
                      title: (
                          <div>
                              {usernameKey} {tabKey} {passwordKey}
                          </div>
                      ),
                      key: 'autotype-option-username-tab-password',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                      }),
                      icon: 'pass-passkey',
                  },
              ] as const)
            : []),
        ...(hasEmailAndPassword
            ? ([
                  {
                      title: (
                          <div>
                              {emailKey} {tabKey} {passwordKey} {enterKey}
                          </div>
                      ),
                      key: 'autotype-option-email-tab-password-enter',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail), deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      icon: 'pass-passkey',
                  },
                  {
                      title: (
                          <div>
                              {emailKey} {tabKey} {passwordKey}
                          </div>
                      ),
                      key: 'autotype-option-email-tab-password',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail), deobfuscate(data.content.password)],
                      }),
                      icon: 'pass-passkey',
                  },
              ] as const)
            : []),
        ...(hasUsername
            ? ([
                  {
                      title: (
                          <div>
                              {usernameKey} {enterKey}
                          </div>
                      ),
                      key: 'autotype-option-username-enter',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername)],
                          enterAtTheEnd: true,
                      }),
                      icon: 'user',
                  },
                  {
                      title: <div>{usernameKey}</div>,
                      key: 'autotype-option-username',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername)],
                      }),
                      icon: 'user',
                  },
              ] as const)
            : []),
        ...(hasEmail
            ? ([
                  {
                      title: (
                          <div>
                              {emailKey} {enterKey}
                          </div>
                      ),
                      key: 'autotype-option-email-enter',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail)],
                          enterAtTheEnd: true,
                      }),
                      icon: 'envelope',
                  },
                  {
                      title: <div>{emailKey}</div>,
                      key: 'autotype-option-email',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail)],
                      }),
                      icon: 'envelope',
                  },
              ] as const)
            : []),
        ...(hasPassword
            ? ([
                  {
                      title: (
                          <div>
                              {passwordKey} {enterKey}
                          </div>
                      ),
                      key: 'autotype-option-password-enter',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                      icon: 'key',
                  },
                  {
                      title: <div>{passwordKey}</div>,
                      key: 'autotype-option-password',
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.password)],
                      }),
                      icon: 'key',
                  },
              ] as const)
            : []),
    ];

    return <AutotypeDropdown actions={autotypeActions} />;
};
