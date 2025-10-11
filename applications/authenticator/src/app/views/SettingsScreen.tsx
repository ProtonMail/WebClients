import { type FC, useMemo, useState } from 'react';

import { ExportModal } from 'proton-authenticator/app/components/Settings/Export/ExportModal';
import { ImportDropdown } from 'proton-authenticator/app/components/Settings/Import/ImportDropdown';
import { LockSelect } from 'proton-authenticator/app/components/Settings/Locks/LockSelect';
import { ProtonSyncModal } from 'proton-authenticator/app/components/Settings/Sync/ProtonSyncModal';
import { useStorageKeySource } from 'proton-authenticator/app/hooks/useStorageKey';
import { PasswordUnlockProvider } from 'proton-authenticator/app/providers/PasswordUnlockProvider';
import app from 'proton-authenticator/lib/app';
import { config } from 'proton-authenticator/lib/app/env';
import { getProtonProducts } from 'proton-authenticator/lib/app/products';
import { BACKUP_MAX_AMOUNT } from 'proton-authenticator/lib/backup/writer';
import { StorageKeySource } from 'proton-authenticator/lib/storage-key/types';
import { logout } from 'proton-authenticator/store/auth';
import { createBackup } from 'proton-authenticator/store/backup';
import { changeBackupDirectory, toggleBackup, updateSettings } from 'proton-authenticator/store/settings';
import { useAppDispatch, useAppSelector } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { prop } from '@proton/pass/utils/fp/lens';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';
import { AUTHENTICATOR_APP_NAME, AUTHENTICATOR_SHORT_APP_NAME, BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const Settings: FC<{ onClose: () => void }> = ({ onClose }) => {
    const storageKey = useStorageKeySource();

    const dispatch = useAppDispatch();
    const settings = useAppSelector(prop('settings'));
    const { syncState, user } = useAppSelector(prop('auth'));

    const { digitStyle, hideCodes, theme, backupDirectory, lastBackupEpoch, animateCodes } = settings;
    const lastBackupDateDisplay = lastBackupEpoch ? epochToRelativeDaysAgo(lastBackupEpoch) : undefined;

    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showAutomaticBackupModal, setShowAutomaticBackupModal] = useState(false);
    const protonProducts = useMemo(getProtonProducts, []);

    const onToggleSync = () => {
        if (syncState !== 'off') return dispatch(logout());
        return setShowSyncModal(true);
    };

    const onEnableAutomaticBackup = async (password: string) => {
        await dispatch(toggleBackup({ enabled: true, password }))
            .then(() => setShowAutomaticBackupModal(false))
            .catch(noop);
    };

    const onExport = async (password?: string) => {
        await dispatch(createBackup(password))
            .unwrap()
            .then(() => setShowExportModal(false))
            .catch(noop);
    };

    const SyncLabel = () => {
        if (syncState === 'error') return c('authenticator-2025:Label').t`Enabled, temporarily offline`;
        if (user?.Email) return c('authenticator-2025:Label').t`Account: ${user.Email}`;
        if (syncState !== 'off') return c('authenticator-2025:Label').t`Loading account data...`;
    };

    const syncLoading = syncState === 'loading';

    return (
        <PasswordUnlockProvider>
            <ModalTwo open onClose={onClose}>
                <ModalTwoHeader title={c('authenticator-2025:Title').t`Settings`}></ModalTwoHeader>
                <ModalTwoContent>
                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label').t`Security`}</label>

                        {storageKey.source === StorageKeySource.FALLBACK && (
                            <Banner variant={BannerVariants.WARNING} className="mb-2">
                                <div className="text-sm">
                                    <span>
                                        {c('authenticator-2025:Warning')
                                            .t`Your local data is encrypted on-disk, but the encryption key is not securely stored on your system. For better protection, set up secure storage or create an app password.`}{' '}
                                        <InlineLinkButton
                                            onClick={() => storageKey.generate(StorageKeySource.KEYRING).catch(noop)}
                                            color="warning"
                                            style={{
                                                '--link-hover': 'var(--signal-warning)',
                                                '--link-focus': 'var(--signal-warning)',
                                                '--link-active': 'var(--signal-warning)',
                                            }}
                                        >
                                            {c('authenticator-2025:Action').t`Secure now`}
                                        </InlineLinkButton>
                                    </span>
                                </div>
                            </Banner>
                        )}

                        <InlineFieldBox
                            label={
                                <>
                                    <div>{c('authenticator-2025:Action').t`Sync between devices`}</div>
                                    <div className="text-sm color-weak">
                                        <SyncLabel />
                                    </div>
                                </>
                            }
                        >
                            <Toggle
                                id="sync-toggle"
                                checked={syncState !== 'off'}
                                loading={syncLoading}
                                onChange={onToggleSync}
                            />
                        </InlineFieldBox>

                        <InlineFieldBox className="w-full" label={c('authenticator-2025:Label').t`App lock`}>
                            <LockSelect disabled={syncLoading} />
                        </InlineFieldBox>

                        <InlineFieldBox label={c('Action').t`Hide codes`}>
                            <Toggle
                                id="hide-toggle"
                                checked={hideCodes}
                                onChange={() => dispatch(updateSettings({ hideCodes: !hideCodes }))}
                            />
                        </InlineFieldBox>
                    </section>

                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label').t`Backups`}</label>
                        <InlineFieldBox
                            label={
                                <>
                                    <div>{c('Action').t`Automatic backups`}</div>
                                    {lastBackupDateDisplay && (
                                        <div className="text-sm color-weak">{c('authenticator-2025:Info')
                                            .t`Last backup: ${lastBackupDateDisplay}.`}</div>
                                    )}
                                    <div className="text-sm color-weak">{
                                        // translator: full sentence: Only the last 5 daily backups are kept. Always plural.
                                        c('authenticator-2025:Info')
                                            .t`Only the last ${BACKUP_MAX_AMOUNT} daily backups are kept.`
                                    }</div>
                                </>
                            }
                        >
                            <Toggle
                                id="backup-toggle"
                                checked={Boolean(backupDirectory)}
                                onChange={({ target: { checked } }) =>
                                    checked
                                        ? setShowAutomaticBackupModal(true)
                                        : dispatch(toggleBackup({ enabled: false }))
                                }
                            />
                        </InlineFieldBox>

                        {Boolean(backupDirectory) && (
                            <>
                                <InlineFieldBox
                                    className="flex flex-nowrap justify-space-between gap-4"
                                    childrenClassName="shrink-0"
                                    label={
                                        <>
                                            <div>{c('authenticator-2025:Label').t`Backup folder`}</div>
                                            {backupDirectory && (
                                                <MiddleEllipsis text={backupDirectory} className="text-sm color-weak" />
                                            )}
                                        </>
                                    }
                                >
                                    <Button
                                        onClick={() => dispatch(changeBackupDirectory())}
                                        className="w-full text-nowrap"
                                        color="weak"
                                        shape="outline"
                                    >
                                        {c('authenticator-2025:Action').t`Change folder`}
                                    </Button>
                                </InlineFieldBox>
                            </>
                        )}
                    </section>

                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label').t`Appearance`}</label>

                        <InlineFieldBox className="w-full" label={c('authenticator-2025:Label').t`Theme`}>
                            <SelectTwo
                                value={theme}
                                onChange={({ value: theme }) => dispatch(updateSettings({ theme }))}
                            >
                                <Option title={c('authenticator-2025:Label').t`Automatic`} value="auto" />
                                <Option title={c('authenticator-2025:Label').t`Dark`} value="dark" />
                                <Option title={c('authenticator-2025:Label').t`Light`} value="light" />
                            </SelectTwo>
                        </InlineFieldBox>

                        <InlineFieldBox className="w-full" label={c('authenticator-2025:Label').t`Digit style`}>
                            <SelectTwo
                                value={digitStyle}
                                onChange={({ value: digitStyle }) => dispatch(updateSettings({ digitStyle }))}
                            >
                                <Option title={c('authenticator-2025:Label').t`Plain`} value="plain" />
                                <Option title={c('authenticator-2025:Label').t`Boxed`} value="boxed" />
                            </SelectTwo>
                        </InlineFieldBox>

                        <InlineFieldBox label={c('Action').t`Animate code change`}>
                            <Toggle
                                id="animate-code-toggle"
                                checked={animateCodes}
                                onChange={() => dispatch(updateSettings({ animateCodes: !animateCodes }))}
                            />
                        </InlineFieldBox>
                    </section>

                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label')
                            .t`Manage your data`}</label>

                        <div className="flex flex-nowrap gap-4">
                            <SimpleDropdown
                                content={c('authenticator-2025:Label').t`Import`}
                                className="w-full bg-gray"
                                hasCaret={false}
                            >
                                <ImportDropdown />
                            </SimpleDropdown>
                            <Button
                                color="weak"
                                shape="outline"
                                className="w-full bg-gray"
                                onClick={() => setShowExportModal(true)}
                            >
                                {c('authenticator-2025:Label').t`Export`}
                            </Button>
                        </div>
                    </section>

                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label').t`Support`}</label>

                        <div className="flex flex-nowrap gap-4">
                            <Button
                                className="w-full text-nowrap text-ellipsis bg-gray"
                                color="weak"
                                shape="outline"
                                onClick={() =>
                                    app.openUrl('https://proton.me/support/get-started-proton-authenticator')
                                }
                            >
                                {c('authenticator-2025:Action').t`How to use ${AUTHENTICATOR_SHORT_APP_NAME}`}
                            </Button>
                            <Button
                                className="w-full text-nowrap text-ellipsis bg-gray"
                                color="weak"
                                shape="outline"
                                onClick={() => app.openUrl('https://proton.me/support/contact')}
                            >
                                {c('authenticator-2025:Action').t`Report an issue`}
                            </Button>
                        </div>
                    </section>

                    <section className="mb-5">
                        <label className="block text-bold mb-2">{c('authenticator-2025:Label')
                            .t`Discover ${BRAND_NAME}`}</label>

                        <div className="grid gap-3 grid-cols-3">
                            {protonProducts.map(({ icon: Icon, name, slug }) => (
                                <Button
                                    key={name}
                                    onClick={() => app.openUrl(`https://proton.me/${slug}`)}
                                    color="weak"
                                    shape="outline"
                                >
                                    <Icon variant="glyph-only" />
                                    <div className="text-sm text-bold text-nowrap text-ellipsis">{name}</div>
                                </Button>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-space-between items-center">
                        <span className="color-weak text-sm">
                            {AUTHENTICATOR_APP_NAME} v{config.APP_VERSION}
                        </span>

                        <Button
                            shape="ghost"
                            color="weak"
                            size="small"
                            className="rounded-none text-sm"
                            onClick={app.openLogs}
                        >
                            <Icon name="window-terminal" className="mr-2" />
                            <span>{c('authenticator-2025:Label').t`View logs`}</span>
                        </Button>
                    </div>
                </ModalTwoContent>
            </ModalTwo>
            {showSyncModal && <ProtonSyncModal onClose={() => setShowSyncModal(false)} />}
            {showExportModal && (
                <ExportModal
                    onSubmit={onExport}
                    onClose={() => setShowExportModal(false)}
                    title={c('Title').t`Set export password`}
                    unsafeCTA={c('Action').t`Export data without password`}
                />
            )}
            {showAutomaticBackupModal && (
                <ExportModal
                    onSubmit={(password) => password && onEnableAutomaticBackup(password)}
                    onClose={() => setShowAutomaticBackupModal(false)}
                    title={c('Title').t`Set backup password`}
                />
            )}
        </PasswordUnlockProvider>
    );
};
