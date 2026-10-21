import { useCallback, useRef, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { useOffline } from '@proton/pass/components/Core/ConnectivityProvider';
import { ProgressModal } from '@proton/pass/components/FileAttachments/ProgressModal';
import { ImportDropzone } from '@proton/pass/components/Import/ImportDropzone';
import { ImportVaultsPickerModal } from '@proton/pass/components/Import/ImportVaultsPickerModal';
import { PasswordModal } from '@proton/pass/components/Lock/PasswordModal';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import type {
    OnPassphraseImportResult,
    OnWillSubmitImport,
    OnWillSubmitImportResult,
} from '@proton/pass/hooks/import/useImportForm';
import { useImportForm } from '@proton/pass/hooks/import/useImportForm';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { type ImportProvider, type ImportProviderInfo, PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { type XorObfuscation, deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { Header } from './Header';
import uploadIcon from './upload-icon.png';

import './ImportUpload.scss';

export const ImportUpload = () => {
    const history = useHistory();

    const { provider: providerKeyRaw } = useParams<{ provider: string }>();
    const providerKey = providerKeyRaw as ImportProvider;
    const provider: Maybe<ImportProviderInfo> = PROVIDER_INFO_MAP[providerKey];

    const offline = useOffline();
    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const willSubmitResolver = useRef<(value: OnWillSubmitImportResult) => void>();
    const passphraseModal = useAsyncModalHandles<OnPassphraseImportResult>({ getInitialModalState: () => ({}) });

    const onWillSubmit = useCallback<OnWillSubmitImport>(
        async (payload) =>
            new Promise((resolve) => {
                setImportData(payload);
                willSubmitResolver.current = pipe(
                    resolve,
                    tap(() => {
                        willSubmitResolver.current = undefined;
                        setImportData(null);
                    })
                );
            }),
        []
    );

    const { form, dropzone, busy, progress, cancel } = useImportForm({
        importEntryPoint: 'onboarding',
        provider: providerKey,
        onWillSubmit,
        onPassphrase: () =>
            new Promise((onSubmit) => passphraseModal.handler({ onSubmit }).catch(() => ({ ok: false }))),
        onSuccess: () => history.push('/import/report'),
    });

    // Provider doesn't exist, go back
    if (!providerKey || !provider) return <Redirect to="/import" />;

    const hasFile = form.values.file !== null;

    const handlePassphraseClose = () => passphraseModal.resolver({ ok: false });
    const handlePassphraseSubmit = (passphrase: XorObfuscation) =>
        passphraseModal.resolver({ ok: true, passphrase: deobfuscate(passphrase, { zeroize: true }) });

    const handleVaultsPickerClose = () => willSubmitResolver.current?.({ ok: false });
    const handleVaultsPickerSubmit = (payload: ImportPayload) =>
        willSubmitResolver.current?.(payload.vaults.length === 0 ? { ok: false } : { ok: true, payload });

    return (
        <Layout>
            <div className="flex flex-column items-center lg:w-2/3 gap-8">
                <Header
                    title={c('Title').t`Upload your data`}
                    subtitle={c('Title').t`Important: Once your data has been imported, delete the exported file.`}
                    stepper={{ step: 'upload', provider: providerKey }}
                />
                <FormikProvider value={form}>
                    <Form className="w-full" style={hasFile ? {} : { '--min-h-custom': '30rem' }}>
                        <ImportDropzone
                            {...{ form, dropzone, busy }}
                            buttonProps={{ pill: true, shape: 'outline', color: 'weak' }}
                            illustration={<img src={uploadIcon} alt="" />}
                        />
                        <OnboardingButton
                            variant="outline"
                            fullWidth
                            color="norm"
                            className="text-semibold"
                            disabled={offline || busy || !form.isValid}
                            loading={busy}
                            type="submit"
                        >
                            {busy ? c('Action').t`Importing` : c('Action').t`Import`}
                        </OnboardingButton>
                    </Form>
                </FormikProvider>

                {progress !== null && (
                    <ProgressModal
                        progress={progress}
                        title={c('Title').t`Importing your data`}
                        message={c('Info')
                            .t`Please keep this window open while your data is being imported. This process may take a few minutes.`}
                        onCancel={cancel}
                    />
                )}

                {passphraseModal.state.open && (
                    <PasswordModal
                        loading={passphraseModal.state.loading}
                        open
                        submitLabel={c('Action').t`Confirm`}
                        title={c('Title').t`Encrypted import`}
                        type="current-password"
                        onClose={handlePassphraseClose}
                        onSubmit={handlePassphraseSubmit}
                    />
                )}

                {importData !== null && (
                    <ImportVaultsPickerModal
                        disabled={offline}
                        payload={importData}
                        onClose={handleVaultsPickerClose}
                        onSubmit={handleVaultsPickerSubmit}
                    />
                )}
            </div>
        </Layout>
    );
};
