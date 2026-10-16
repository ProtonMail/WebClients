import type { ReactNode } from 'react';

import { c } from 'ttag';

import onePassword1 from './illustrations/1p1.png';
import onePassword2 from './illustrations/1p2.png';
import apple1 from './illustrations/apple1.png';
import bitwarden1 from './illustrations/bitwarden1.png';
import bitwarden2 from './illustrations/bitwarden2.png';
import bitwarden3 from './illustrations/bitwarden3.png';
import brave1 from './illustrations/brave1.png';
import brave2 from './illustrations/brave2.png';
import brave3 from './illustrations/brave3.png';
import chrome1 from './illustrations/chrome1.png';
import chrome2 from './illustrations/chrome2.png';
import chrome3 from './illustrations/chrome3.png';
import dashlane1 from './illustrations/dashlane1.png';
import dashlane2 from './illustrations/dashlane2.png';
import dashlane3 from './illustrations/dashlane3.png';
import edge1 from './illustrations/edge1.png';
import edge2 from './illustrations/edge2.png';
import edge3 from './illustrations/edge3.png';
import enpass1 from './illustrations/enpass1.png';
import firefox1 from './illustrations/firefox1.png';
import firefox2 from './illustrations/firefox2.png';
import kaspersky1 from './illustrations/kaspersky1.png';
import keepass1 from './illustrations/keepass1.png';
import keeper1 from './illustrations/keeper1.png';
import keeper2 from './illustrations/keeper2.png';
import lastpass1 from './illustrations/lp1.png';
import lastpass2 from './illustrations/lp2.png';
import lastpass3 from './illustrations/lp3.png';
import lastpass4 from './illustrations/lp4.png';
import nordpass1 from './illustrations/nordpass1.png';
import nordpass2 from './illustrations/nordpass2.png';
import proton1 from './illustrations/proton1.png';
import proton2 from './illustrations/proton2.png';
import roboform1 from './illustrations/roboform1.png';
import roboform2 from './illustrations/roboform2.png';
import safari1 from './illustrations/safari1.png';
import { ImportProvider, PROVIDER_INFO_MAP } from './types';

type StepProps = { image?: string; children: ReactNode };

const Step = ({ image, children }: StepProps) => (
    <li>
        <p>{children}</p>
        {image && <img src={image} alt="" />}
    </li>
);

type Tutorial = (providerName: ReactNode) => ReactNode;

/* labels shared across several providers — ttag strings must be evaluated at render time */

const getSharedLabels = () => ({
    file: <strong key="file">{c('Import Tutorial').t`File`}</strong>,
    settings: <strong key="settings">{c('Import Tutorial').t`Settings`}</strong>,
    exportLabel: <strong key="export">{c('Import Tutorial').t`Export`}</strong>,
    exportPasswords: <strong key="exportPasswords">{c('Import Tutorial').t`Export passwords`}</strong>,
});

const TUTORIALS: Record<ImportProvider, Tutorial> = {
    [ImportProvider.PROTONPASS]: (name) => {
        const { settings, exportLabel } = getSharedLabels();

        return (
            <>
                <Step image={proton1}>{c('Import Tutorial')
                    .jt`Open ${name} and select ${settings} → ${exportLabel}.`}</Step>
                <Step image={proton2}>{c('Import Tutorial').jt`Choose the file format → Select ${exportLabel}.`}</Step>
            </>
        );
    },
    [ImportProvider.CHROME]: (name) => {
        const { settings, exportPasswords } = getSharedLabels();
        const passwordsAndAutofill = (
            <strong key="passwordsAndAutofill">{c('Import Tutorial').t`Passwords and Autofill`}</strong>
        );
        const googlePasswordManager = (
            <strong key="google-password-manager">{c('Import Tutorial').t`Google Password Manager`}</strong>
        );
        const downloadFile = <strong key="downloadFile">{c('Import Tutorial').t`Download file`}</strong>;

        return (
            <>
                <Step image={chrome1}>
                    {c('Import Tutorial')
                        .jt`Open ${name} and go to ⋮ → ${passwordsAndAutofill} → ${googlePasswordManager}.`}
                </Step>
                <Step image={chrome2}>{c('Import Tutorial').jt`Navigate to ${settings} tab.`}</Step>
                <Step image={chrome3}>
                    {c('Import Tutorial').jt`Go to ${exportPasswords} and select ${downloadFile}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.BRAVE]: (name) => {
        const { settings } = getSharedLabels();
        const autoFill = <strong key="autoFill">{c('Import Tutorial').t`Autofill and passwords`}</strong>;
        const passwords = <strong key="passwords">{c('Import Tutorial').t`Passwords`}</strong>;
        const downloadFile = <strong key="downloadFile">{c('Import Tutorial').t`Download file`}</strong>;

        return (
            <>
                <Step image={brave1}>
                    {c('Import Tutorial').jt`Open ${name} and go to ☰ → ${settings} → ${autoFill}.`}
                </Step>
                <Step image={brave2}>{c('Import Tutorial').jt`Go to ${passwords}.`}</Step>
                <Step image={brave3}>{c('Import Tutorial').jt`Go to ☰ → ⚙ ${settings} → Click ${downloadFile}.`}</Step>
            </>
        );
    },
    [ImportProvider.ONEPASSWORD]: (name) => {
        const { file, exportLabel } = getSharedLabels();
        const format1pux = <strong key="format1pux">{c('Import Tutorial').t`Export file format: 1PUX`}</strong>;
        const exportData = <strong key="exportData">{c('Import Tutorial').t`Export Data`}</strong>;

        return (
            <>
                <Step image={onePassword1}>
                    {c('Import Tutorial')
                        .jt`Open ${name} and go to ${file} → ${exportLabel} → your 1Password username.`}
                </Step>
                <Step image={onePassword2}>
                    {c('Import Tutorial')
                        .jt`Enter your 1Password master password, ensure ${format1pux} is selected, and click ${exportData}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.BITWARDEN]: (name) => {
        const { settings, exportLabel } = getSharedLabels();
        const vaultOptions = <strong key="vaultOptions">{c('Import Tutorial').t`Vault options`}</strong>;
        const formatJson = <strong key="formatJson">.json</strong>;

        return (
            <>
                <Step image={bitwarden1}>
                    {c('Import Tutorial').jt`Open ${name} and go to ${settings} → ${vaultOptions}.`}
                </Step>
                <Step image={bitwarden2}>{c('Import Tutorial').jt`Select ${exportLabel}.`}</Step>
                <Step image={bitwarden3}>
                    {c('Import Tutorial')
                        .jt`Choose ${formatJson} as the file format, click ${exportLabel} and confirm with your master password.`}
                </Step>
            </>
        );
    },
    [ImportProvider.LASTPASS]: (name) => {
        const { exportLabel } = getSharedLabels();
        const advancedOptions = <strong key="advancedOptions">{c('Import Tutorial').t`Advanced Options`}</strong>;
        const manageYourVault = <strong key="manageYourVault">{c('Import Tutorial').t`Manage your vault`}</strong>;
        const continueExport = <strong key="continueExport">{c('Import Tutorial').t`Continue export`}</strong>;
        const submit = <strong key="submit">{c('Import Tutorial').t`Submit`}</strong>;

        return (
            <>
                <Step image={lastpass1}>
                    {c('Import Tutorial')
                        .jt`Open ${name} and go to ${advancedOptions} → ${manageYourVault} → ${exportLabel}.`}
                </Step>
                <Step image={lastpass2}>
                    {c('Import Tutorial')
                        .jt`As a security measure, LastPass will email you to confirm the request. Open the email and click ${continueExport}.`}
                </Step>
                <Step image={lastpass3}>
                    {c('Import Tutorial')
                        .jt`At the confirmation screen, log back into your ${name} Vault and to ${advancedOptions} → ${manageYourVault} → ${exportLabel} again.`}
                </Step>
                <Step image={lastpass4}>
                    {c('Import Tutorial')
                        .jt`This time, you’ll be asked to re-confirm your ${name} username and password. Click ${submit}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.APPLEPASSWORDS]: (name) => {
        const { file } = getSharedLabels();
        const exportAll = <strong key="exportAll">{c('Import Tutorial').t`Export All Passwords to File`}</strong>;

        return (
            <>
                <Step image={apple1}>{c('Import Tutorial').jt`Open ${name} and go to ${file} → ${exportAll}.`}</Step>
            </>
        );
    },
    [ImportProvider.KEEPER]: (name) => {
        const { settings, exportLabel } = getSharedLabels();
        const exportAgain = <strong key="export-2">{c('Import Tutorial').t`Export`}</strong>;
        const yourUsername = <strong key="yourUsername">{c('Import Tutorial').t`your username`}</strong>;
        const chooseJson = <strong key="chooseJson">{c('Import Tutorial').t`Choose JSON downloads`}</strong>;

        return (
            <>
                <Step image={keeper1}>
                    {c('Import Tutorial').jt`Open ${name} and select ${yourUsername} → ${settings}.`}
                </Step>
                <Step image={keeper2}>
                    {c('Import Tutorial').jt`Select ${exportLabel} → ${chooseJson} → ${exportAgain}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.ROBOFORM]: (name) => {
        const { settings, exportLabel } = getSharedLabels();
        const accountAndData = <strong key="accountAndData">{c('Import Tutorial').t`Account & Data`}</strong>;

        return (
            <>
                <Step image={roboform1}>{c('Import Tutorial').jt`Open ${name} and select ${settings}.`}</Step>
                <Step image={roboform2}>{c('Import Tutorial').jt`Select ${accountAndData} → ${exportLabel}.`}</Step>
            </>
        );
    },
    [ImportProvider.NORDPASS]: (name) => {
        const { settings } = getSharedLabels();
        const exportItems = <strong key="exportItems">{c('Import Tutorial').t`Export items`}</strong>;

        return (
            <>
                <Step image={nordpass1}>{c('Import Tutorial').jt`Open ${name} and select ${settings}.`}</Step>
                <Step image={nordpass2}>{c('Import Tutorial').jt`Select ${exportItems}.`}</Step>
            </>
        );
    },
    [ImportProvider.KEEPASS]: (name) => {
        const { file, exportLabel } = getSharedLabels();

        return (
            <>
                <Step image={keepass1}>{c('Import Tutorial')
                    .jt`Open ${name} and select ${file} → ${exportLabel}.`}</Step>
            </>
        );
    },
    [ImportProvider.KASPERSKY]: (name) => {
        const moreActions = <strong key="moreActions">{c('Import Tutorial').t`More actions`}</strong>;
        const exportToTxt = <strong key="exportToTxt">{c('Import Tutorial').t`Export to TXT`}</strong>;

        return (
            <>
                <Step image={kaspersky1}>
                    {c('Import Tutorial').jt`Open ${name} and select ${moreActions} → ${exportToTxt}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.ENPASS]: (name) => {
        const { file, exportLabel } = getSharedLabels();

        return (
            <>
                <Step image={enpass1}>{c('Import Tutorial')
                    .jt`Open ${name} and select ${file} → ${exportLabel}.`}</Step>
            </>
        );
    },
    [ImportProvider.DASHLANE]: (name) => {
        const { settings } = getSharedLabels();
        const vault = <strong key="vault">{c('Import Tutorial').t`Vault`}</strong>;
        const exportData = <strong key="exportData">{c('Import Tutorial').t`Export data`}</strong>;
        const exportToCsv = <strong key="exportToCsv">{c('Import Tutorial').t`Export to CSV`}</strong>;

        return (
            <>
                <Step image={dashlane1}>{c('Import Tutorial')
                    .jt`Open ${name} and select ${vault} → ${settings}.`}</Step>
                <Step image={dashlane2}>{c('Import Tutorial').jt`Select ${exportData}.`}</Step>
                <Step image={dashlane3}>{c('Import Tutorial').jt`Select ${exportToCsv}.`}</Step>
            </>
        );
    },
    [ImportProvider.SAFARI]: (name) => {
        const { file } = getSharedLabels();
        const passwords = <strong key="passwords">{c('Import Tutorial').t`Passwords`}</strong>;
        const exportAll = <strong key="exportAll">{c('Import Tutorial').t`Export All Passwords to File`}</strong>;

        return (
            <>
                <Step image={safari1}>
                    {c('Import Tutorial')
                        .jt`${name} saves your passwords in the ${passwords} app. Open it and go to ${file} → ${exportAll}.`}
                </Step>
            </>
        );
    },
    [ImportProvider.FIREFOX]: (name) => {
        const { exportPasswords } = getSharedLabels();
        const passwords = <strong key="passwords">{c('Import Tutorial').t`Passwords`}</strong>;

        return (
            <>
                <Step image={firefox1}>{c('Import Tutorial').jt`Open ${name} and select ☰ → ${passwords}.`}</Step>
                <Step image={firefox2}>{c('Import Tutorial').jt`Select ⋯ → ${exportPasswords}.`}</Step>
            </>
        );
    },
    [ImportProvider.EDGE]: (name) => {
        const { exportPasswords } = getSharedLabels();
        const passwordsAndAutofill = (
            <strong key="passwordsAndAutofill">{c('Import Tutorial').t`Passwords and autofill`}</strong>
        );
        const microsoftPasswordManager = (
            <strong key="microsoftPasswordManager">{c('Import Tutorial').t`Microsoft password manager`}</strong>
        );

        return (
            <>
                <Step image={edge1}>{c('Import Tutorial').jt`Open ${name} and select ⋯.`}</Step>
                <Step image={edge2}>
                    {c('Import Tutorial').jt`Select ${passwordsAndAutofill} → ${microsoftPasswordManager}.`}
                </Step>
                <Step image={edge3}>{c('Import Tutorial').jt`Select ⋯ → ${exportPasswords}.`}</Step>
            </>
        );
    },
    [ImportProvider.CSV]: () => (
        <>
            <Step>{c('Import Tutorial').t`Identify your password manager.`}</Step>
            <Step>{c('Import Tutorial').t`Go to the settings to locate the export action.`}</Step>
            <Step>{c('Import Tutorial').t`Select the export format CSV.`}</Step>
        </>
    ),
};

export const getTutorial = (provider: ImportProvider): ReactNode => {
    const providerInfo = PROVIDER_INFO_MAP[provider];
    const providerName = <strong key="provider-name">{providerInfo.title}</strong>;

    return TUTORIALS[provider](providerName);
};
