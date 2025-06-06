import { type FC } from 'react';

import { c } from 'ttag';

import { Kbd, Tooltip } from '@proton/atoms';
import type { AutotypeDropdownAction } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import { AutotypeDropdown } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import { AutotypeKeyboardShortcut } from '@proton/pass/components/Item/Autotype/AutotypeKeyboardShortcut';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import type { Item } from '@proton/pass/types';
import { AutotypeKey } from '@proton/pass/types/desktop/autotype';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
};

export const AutotypeDropdownLogin: FC<AutotypeDropdownLoginProps> = ({ data }) => {
    const { actions } = useAutotypeActions(data);

    if (actions.length === 0) return null;

    const tabKey = <Kbd shortcut={c('Keyboard key').t`TAB`} />;
    const enterKey = <Kbd shortcut={c('Keyboard key').t`ENTER`} />;
    const usernameKey = <Kbd shortcut={c('Label').t`USERNAME`} />;
    const emailKey = <Kbd shortcut={c('Label').t`EMAIL`} />;
    const passwordKey = <Kbd shortcut={c('Label').t`PASSWORD`} />;

    const autotypeActions: AutotypeDropdownAction[] = actions
        .map<AutotypeDropdownAction>((action) => {
            switch (action.key) {
                case AutotypeKey.USERNAME_TAB_PASSWORD_ENTER:
                    return {
                        ...action,
                        title: (
                            <div>
                                {usernameKey} {tabKey} {passwordKey} {enterKey}
                            </div>
                        ),
                        icon: 'pass-passkey',
                    };
                case AutotypeKey.USERNAME_TAB_PASSWORD:
                    return {
                        ...action,
                        title: (
                            <div>
                                {usernameKey} {tabKey} {passwordKey}
                            </div>
                        ),
                        icon: 'pass-passkey',
                    };
                case AutotypeKey.EMAIL_TAB_PASSWORD_ENTER:
                    return {
                        ...action,
                        title: (
                            <div>
                                {emailKey} {tabKey} {passwordKey} {enterKey}
                            </div>
                        ),
                        icon: 'pass-passkey',
                    };
                case AutotypeKey.EMAIL_TAB_PASSWORD:
                    return {
                        ...action,
                        title: (
                            <div>
                                {emailKey} {tabKey} {passwordKey}
                            </div>
                        ),
                        icon: 'pass-passkey',
                    };
                case AutotypeKey.USERNAME_ENTER:
                    return {
                        ...action,
                        title: (
                            <div>
                                {usernameKey} {enterKey}
                            </div>
                        ),
                        icon: 'user',
                    };
                case AutotypeKey.EMAIL_ENTER:
                    return {
                        ...action,
                        title: (
                            <div>
                                {emailKey} {enterKey}
                            </div>
                        ),
                        icon: 'envelope',
                    };
                case AutotypeKey.PASSWORD_ENTER:
                    return {
                        ...action,
                        title: (
                            <div>
                                {passwordKey} {enterKey}
                            </div>
                        ),
                        icon: 'key',
                    };
            }
        })
        .map((action, index) =>
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

    return <AutotypeDropdown actions={autotypeActions} />;
};
