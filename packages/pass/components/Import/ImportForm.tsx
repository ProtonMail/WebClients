import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { UpsellRef } from '../../constants';
import type { ImportFormContext } from '../../hooks/import/useImportForm';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { ImportProvider, ImportProviderValues, PROVIDER_INFO_MAP, getSupportedFileTypes } from '../../lib/import/types';
import { selectPassPlan } from '../../store/selectors';
import type { MaybeNull } from '../../types';
import { PassFeature } from '../../types/api/features';
import { UserPassPlan } from '../../types/api/plan';
import { Card } from '../Layout/Card/Card';
import { UpgradeButton } from '../Upsell/UpgradeButton';
import { ImportDropzone } from './ImportDropzone';
import { ImportIcon } from './ImportIcon';
import { ImportProviderItem } from './ImportProviderItem';

import './ImportForm.scss';

const providerHasUnsupportedItemTypes = (provider: ImportProvider) =>
    ![
        ImportProvider.APPLEPASSWORDS,
        ImportProvider.BRAVE,
        ImportProvider.FIREFOX,
        ImportProvider.CHROME,
        ImportProvider.EDGE,
        ImportProvider.SAFARI,
        ImportProvider.CSV,
        ImportProvider.PROTONPASS,
    ].includes(provider);

const providerHasFileAttachments = (provider: ImportProvider) =>
    [ImportProvider.ONEPASSWORD, ImportProvider.ENPASS, ImportProvider.BITWARDEN].includes(provider);

export const ImportForm: FC<Pick<ImportFormContext, 'form' | 'dropzone' | 'busy'>> = ({ form, dropzone, busy }) => {
    const customItemsEnabled = useFeatureFlag(PassFeature.PassCustomTypeV1);
    const free = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const onSelectProvider = (provider: MaybeNull<ImportProvider>) => () => {
        if (provider) {
            dropzone.setSupportedFileTypes(getSupportedFileTypes(provider));
        }
        void form.setValues({ provider, file: null });
    };

    return (
        <>
            <div className="mb-2">
                <strong>{c('Label').t`Select your password manager`}</strong>
                {form.values.provider && (
                    <InlineLinkButton onClick={onSelectProvider(null)} className="ml-2">
                        {c('Action').t`Change`}
                    </InlineLinkButton>
                )}
            </div>

            {!form.values.provider && (
                <>
                    <div className="pass-import-providers--grid gap-3 mb-4">
                        {ImportProviderValues.map((provider) => (
                            <ImportProviderItem
                                onClick={onSelectProvider(provider)}
                                key={provider}
                                value={provider}
                                title={PROVIDER_INFO_MAP[provider].title}
                                fileExtension={PROVIDER_INFO_MAP[provider].fileExtension}
                            />
                        ))}
                    </div>
                    <Href href="https://protonmail.uservoice.com/forums/953584-proton-pass">{c('Action')
                        .t`Your password manager is not here? Request it.`}</Href>
                </>
            )}

            {form.values.provider && (
                <>
                    <div className="flex justify-space-between items-center mt-3 mb-4">
                        <div className="flex items-center">
                            <div className="mr-2">
                                <ImportIcon provider={form.values.provider} />
                            </div>
                            <div className="flex flex-column ml-3">
                                <span>{PROVIDER_INFO_MAP[form.values.provider].title}</span>
                                <span className="color-weak">
                                    {PROVIDER_INFO_MAP[form.values.provider].fileExtension}
                                </span>
                            </div>
                        </div>
                        {PROVIDER_INFO_MAP[form.values.provider].tutorialUrl && (
                            <Href
                                href={PROVIDER_INFO_MAP[form.values.provider].tutorialUrl}
                                className="flex items-center"
                            >
                                {c('Action').t`How do I export my data from ${
                                    PROVIDER_INFO_MAP[form.values.provider].title
                                }?`}
                                <IcArrowOutSquare className="ml-2" />
                            </Href>
                        )}
                    </div>

                    {form.values.provider === ImportProvider.CSV && (
                        <Card className="mb-4 text-sm" type="primary">
                            {c('Info').t`Follow those steps to import your data with a generic CSV:`}
                            <ol className="mt-2 mb-0">
                                <li>
                                    <Href
                                        href="https://pass.proton.me/assets/protonpass-import.csv"
                                        download="protonpass-import.csv"
                                    >
                                        {BUILD_TARGET === 'safari'
                                            ? c('Action').t`Right click and download this CSV`
                                            : c('Action').t`Download this CSV template`}
                                    </Href>
                                </li>
                                <li>{c('Info').t`Fill in the CSV with your data`}</li>
                                <li>{c('Info').t`Import the CSV file below.`}</li>
                                <li>
                                    {c('Info')
                                        .t`After successfully importing your data, you may delete the CSV file containing your passwords for security.`}
                                </li>
                            </ol>
                        </Card>
                    )}

                    <ImportDropzone {...{ form, dropzone, busy }} />

                    {!customItemsEnabled && providerHasUnsupportedItemTypes(form.values.provider) && (
                        <Card className="mb-4 text-sm" type="primary">
                            {c('Info').t`${PASS_APP_NAME} will only import logins, notes, credit cards and identities.`}
                        </Card>
                    )}

                    {providerHasFileAttachments(form.values.provider) && free && (
                        <Card className="mb-4 text-sm" type="primary">
                            {c('Pass_file_attachments')
                                .t`If your data contains file attachments, they will not be imported.`}
                            {BUILD_TARGET !== 'safari' && (
                                <>
                                    {' '}
                                    <UpgradeButton
                                        inline
                                        label={c('Pass_file_attachments').t`Upgrade to support file attachments`}
                                        upsellRef={UpsellRef.FILE_ATTACHMENTS}
                                    />
                                </>
                            )}
                        </Card>
                    )}
                </>
            )}
        </>
    );
};
