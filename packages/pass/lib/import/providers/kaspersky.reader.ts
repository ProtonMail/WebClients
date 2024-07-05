import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import {
    type KasperskyLogin,
    KasperskyLoginLabel,
    KasperskyNoteLabel,
} from '@proton/pass/lib/import/providers/kaspersky.types';
import { type ImportPayload } from '@proton/pass/lib/import/types';
import { type ItemImportIntent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export const readKasperskyData = ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): ImportPayload => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const kasperskyItems = data
            .replace(/\r\n/g, '\n')
            .split(/---|Websites|Other Accounts|Applications|Notes/)
            .map((section) => section.trim())
            .filter((section) => section.length);
        const items: ItemImportIntent[] = [];

        kasperskyItems.forEach((kasperskyItem) => {
            const lines = kasperskyItem.split('\n');
            const isLoginItem = [
                KasperskyLoginLabel.WEBSITE_NAME,
                KasperskyLoginLabel.APPLICATION,
                KasperskyLoginLabel.ACCOUNT_NAME,
            ].some((prefix) => lines[0].startsWith(prefix));
            const isNoteItem = lines[0].startsWith(KasperskyNoteLabel.NAME);

            if (isLoginItem) {
                let isComment = false;
                const item = lines.reduce<KasperskyLogin>((acc, line) => {
                    if (isComment) {
                        acc.comment += `\n${line}`;
                        return acc;
                    }
                    const [key, value] = line.split(': ');
                    switch (key) {
                        case KasperskyLoginLabel.WEBSITE_NAME:
                            acc.websiteName = value;
                            break;
                        case KasperskyLoginLabel.WEBSITE_URL:
                            acc.websiteURL = value;
                            break;
                        case KasperskyLoginLabel.APPLICATION:
                            acc.application = value;
                            break;
                        case KasperskyLoginLabel.ACCOUNT_NAME:
                            acc.accountName = value;
                            break;
                        case KasperskyLoginLabel.LOGIN_NAME:
                            acc.loginName = value;
                            break;
                        case KasperskyLoginLabel.LOGIN:
                            acc.login = value;
                            break;
                        case KasperskyLoginLabel.PASSWORD:
                            acc.password = value;
                            break;
                        case KasperskyLoginLabel.COMMENT:
                            acc.comment = value;
                            isComment = true;
                            break;
                    }
                    return acc;
                }, {});

                const name = item.loginName || item.websiteName || item.accountName;
                items.push(
                    importLoginItem({
                        name: item.application ? `${item.application} ${name}` : name,
                        note: item.comment,
                        ...(importUsername ? getEmailOrUsername(item.login) : { email: item.login }),
                        password: item.password,
                        urls: item.websiteURL ? [item.websiteURL] : [],
                    })
                );
            } else if (isNoteItem) {
                const name = lines[0].substring(`${KasperskyNoteLabel.NAME}: `.length);
                const note = lines.slice(1).join('\n').substring(`${KasperskyNoteLabel.NOTE}: `.length);

                items.push(
                    importNoteItem({
                        name,
                        note,
                    })
                );
            } else {
                ignored.push(`${kasperskyItem.substring(0, 50)}...`);
            }
        });

        return {
            vaults: [
                {
                    name: getImportedVaultName(),
                    shareId: null,
                    items,
                },
            ],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Kaspersky]', e);
        throw new ImportProviderError('Kaspersky', e);
    }
};
