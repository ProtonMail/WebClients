import { type Item } from '@proton/pass/types';
import type { AutotypeAction } from '@proton/pass/types/desktop/autotype';
import { AutotypeKey } from '@proton/pass/types/desktop/autotype';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export const useAutotypeActions = (data: Item<'login'>) => {
    const hasPassword = Boolean(data.content.password.v);
    const hasUsername = Boolean(data.content.itemUsername.v);
    const hasEmail = Boolean(data.content.itemEmail.v);

    const actions: AutotypeAction[] = [
        ...(hasUsername && hasPassword
            ? [
                  {
                      key: AutotypeKey.USERNAME_TAB_PASSWORD_ENTER,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                          enterAtTheEnd: true,
                      }),
                  },
                  {
                      key: AutotypeKey.USERNAME_TAB_PASSWORD,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemUsername), deobfuscate(data.content.password)],
                      }),
                  },
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
                  },
                  {
                      key: AutotypeKey.EMAIL_TAB_PASSWORD,
                      getAutotypeProps: () => ({
                          fields: [deobfuscate(data.content.itemEmail), deobfuscate(data.content.password)],
                      }),
                  },
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
                  },
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
                  },
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
                  },
              ]
            : []),
    ];

    return { actions };
};
