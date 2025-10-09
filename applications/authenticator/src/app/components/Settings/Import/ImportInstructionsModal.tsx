import type { FC, MouseEvent, ReactNode } from 'react';

import app from 'proton-authenticator/lib/app';
import { CONTACT_URL } from 'proton-authenticator/lib/constants';
import { ImportProvider, UnsupportedImportProviders } from 'proton-authenticator/lib/importers/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

type Props = {
    provider: ImportProvider;
    onClose: () => void;
    onImport: (provider: ImportProvider) => void;
};

/** FIXME: use unique link for each provider once KB article is published */
const onMoreHelpClick = async (e: MouseEvent) => {
    e.preventDefault();
    await app.openUrl(CONTACT_URL);
};

const helpUrl = CONTACT_URL;

const googleSettingsPath = (
    <span className="text-bold" key="google-path">{c('authenticator-2025:Info')
        .t`Settings > Transfer accounts > Export accounts`}</span>
);

const twofasSettingsPath = (
    <span className="text-bold" key="twofas-path">{c('authenticator-2025:Info')
        .t`Settings > 2FAS Backup > Export`}</span>
);

const aegisSettingsPath = (
    <span className="text-bold" key="aegis-path">{c('authenticator-2025:Info')
        .t`Settings > Import & Export > Export`}</span>
);

const bitwardenSettingsPath = (
    <span className="text-bold" key="bitwarden-path">{c('authenticator-2025:Info').t`Settings > Export`}</span>
);

const enteSettingsPath = (
    <span className="text-bold" key="ente-path">{c('authenticator-2025:Info').t`Settings > Data > Export codes`}</span>
);

const plainTextBold = (
    <span className="text-bold" key="plain-text-bold">{c('authenticator-2025:Info').t`Plain text`}</span>
);

const zipTextBold = <span className="text-bold" key="plain-text-bold">{c('authenticator-2025:Info').t`ZIP`}</span>;

const lastpassSettingsPath = (
    <span className="text-bold" key="lastpass-path">{c('authenticator-2025:Info')
        .t`Settings > Transfer accounts > Export accounts to file`}</span>
);

const protonAuthenticatorSettingsPath = (
    <span className="text-bold" key="proton-authenticator-path">{c('authenticator-2025:Info')
        .t`Settings > Export`}</span>
);

const protonPassSettingsPath = (
    <span className="text-bold" key="proton-authenticator-path">{c('authenticator-2025:Info')
        .t`Settings > Export`}</span>
);

const getImportInstruction = (provider: ImportProvider): { instruction: ReactNode; helpUrl?: string } => {
    // To avoid i18n error "translation with duplicate variables"
    let settingsPath: ReactNode;

    switch (provider) {
        case ImportProvider.GOOGLE:
            settingsPath = googleSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info')
                            .t`This will create one or more QR codes that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.TWOFAS:
            settingsPath = twofasSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info').t`This will create a 2fas file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.AEGIS:
            settingsPath = aegisSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info').t`This will create a Json file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.BITWARDEN:
            settingsPath = bitwardenSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info').t`This will create a Json file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.ENTE:
            settingsPath = enteSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info')
                            .jt`Choose ${plainTextBold}, this will create a txt file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.LAST_PASS:
            settingsPath = lastpassSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info').t`This will create a Json file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.PROTON_AUTHENTICATOR:
            settingsPath = protonAuthenticatorSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info').t`This will create a Json file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.PROTON_PASS:
            settingsPath = protonPassSettingsPath;
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info').jt`Please go to ${settingsPath}.`}</div>
                        <div>{c('authenticator-2025:Info')
                            .jt`Choose ${zipTextBold}, this will create a zip file that you can use here.`}</div>
                    </>
                ),
                helpUrl,
            };
        case ImportProvider.AUTHY:
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info')
                            .t`Unfortunately, Authy doesn’t currently support exporting data from their app. Consider contacting Authy to request this feature.`}</div>
                        <div>{c('authenticator-2025:Info').t`Please import your data manually for now.`}</div>
                    </>
                ),
            };
        case ImportProvider.MICROSOFT:
            return {
                instruction: (
                    <>
                        <div>{c('authenticator-2025:Info')
                            .t`Unfortunately, Microsoft Authenticator doesn’t currently support exporting data from their app. Consider contacting Microsoft to request this feature.`}</div>
                        <div>{c('authenticator-2025:Info').t`Please import your data manually for now.`}</div>
                    </>
                ),
            };
    }
};

export const ImportInstructionsModal: FC<Props> = ({ onClose, provider, onImport }) => {
    const { instruction, helpUrl } = getImportInstruction(provider);
    const available = !UnsupportedImportProviders.includes(provider);

    return (
        <ModalTwo open onClose={onClose} size="small">
            <ModalTwoHeader
                title={
                    available
                        ? c('authenticator-2025:Title').t`Import codes from ${provider}`
                        : c('authenticator-2025:Title').t`No export available`
                }
            />
            <ModalTwoContent>
                <div className="flex flex-column gap-3 h-full">
                    <>
                        {instruction}
                        {helpUrl && (
                            <Href onClick={onMoreHelpClick}>{c('authenticator-2025:Action').t`Need more help?`}</Href>
                        )}

                        <div className="flex flex-column gap-3 mt-2 mb-4">
                            {available && (
                                <Button
                                    pill
                                    shape="solid"
                                    color="norm"
                                    onClick={() => onImport(provider)}
                                    className="cta-button"
                                >
                                    {c('authenticator-2025:Action').t`Import`}
                                </Button>
                            )}
                            <Button pill shape="outline" color="weak" onClick={onClose}>
                                {c('authenticator-2025:Action').t`Close`}
                            </Button>
                        </div>
                    </>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
