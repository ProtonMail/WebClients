import { useMemo } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPassPasskey } from '@proton/icons/icons/IcPassPasskey';
import { IcUser } from '@proton/icons/icons/IcUser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { AutotypeKeyboardShortcut } from '../../components/Item/Autotype/AutotypeKeyboardShortcut';
import type { Item } from '../../types';
import type { AutotypeAction } from '../../types/desktop/autotype';
import { AutotypeKey } from '../../types/desktop/autotype';
import { deobfuscate } from '../../utils/obfuscate/xor';

export const useAutotypeActions = (data: Item<'login'>) =>
    useMemo(() => {
        const hasPassword = Boolean(data.content.password.v.length);
        const hasUsername = Boolean(data.content.itemUsername.v.length);
        const hasEmail = Boolean(data.content.itemEmail.v.length);

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
                          icon: IcPassPasskey,
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
                          icon: IcPassPasskey,
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
                          icon: IcPassPasskey,
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
                          icon: IcPassPasskey,
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
                          icon: IcUser,
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
                          icon: IcEnvelope,
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
                          icon: IcKey,
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

        return { actions };
    }, [data]);
