import type { ChangeEvent, FC } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Radio from '@proton/components/components/input/Radio';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { InputField } from '@proton/components/components/v2/field/InputField';
import { IcCross } from '@proton/icons/icons/IcCross';

import { useFeatureFlag } from '../../../../hooks/useFeatureFlag';
import { getRegexError } from '../../../../lib/urls/safe-regex/safe-regex';
import { getModeLabel, getModeWarning, sortDefaultFirst } from '../../../../lib/urls/utils/autofill';
import type { MaybeNull, UrlGroupValues, UrlItem } from '../../../../types';
import { PassFeature } from '../../../../types/api/features';
import { AutofillMode } from '../../../../types/protobuf';
import { usePassCore } from '../../../Core/PassCoreProvider';
import { ButtonBar } from '../../../Layout/Button/ButtonBar';
import { SidebarModal } from '../../../Layout/Modal/SidebarModal';
import { Panel } from '../../../Layout/Panel/Panel';
import { PanelHeader } from '../../../Layout/Panel/PanelHeader';
import { UrlAdvancedHelp } from './UrlAdvancedHelp';

const secondTabModes = [
    AutofillMode.StartWith,
    AutofillMode.RegularExpression,
    AutofillMode.ExactPath,
    AutofillMode.Pattern,
];

const patternOrRegexModes = [AutofillMode.Pattern, AutofillMode.RegularExpression];

const isPatternOrRegex = (mode: AutofillMode) => patternOrRegexModes.includes(mode);

type ModeCheckboxProps = {
    fieldName: string;
    currentMode: AutofillMode;
    mode: AutofillMode;
    onSelect: (mode: AutofillMode) => void;
    disabled?: boolean;
};

const ModeCheckbox: FC<ModeCheckboxProps> = ({ fieldName, currentMode, mode, onSelect, disabled }) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) onSelect(mode);
    };
    return (
        <InputField
            as={Radio}
            name={fieldName}
            checked={currentMode === mode}
            onChange={handleChange}
            disabled={disabled}
        >
            {getModeLabel(mode)}
        </InputField>
    );
};

type UrlAdvancedModalProps = ModalProps & {
    index: MaybeNull<number>;
    initialTestUrl?: string;
};

export const UrlAdvancedModal: FC<UrlAdvancedModalProps> = ({ open, index, initialTestUrl, ...modalProps }) => {
    const { onLink } = usePassCore();
    const { values, setFieldValue, getFieldProps } = useFormikContext<UrlGroupValues>();
    const regexEnabled = useFeatureFlag(PassFeature.PassAutofillUrlRegex);
    const snapshotRef = useRef<MaybeNull<UrlItem>>(null);

    const [superAdvanced, setSuperAdvanced] = useState(false);
    const [regexError, setRegexError] = useState<string>();

    const urlItem = index !== null ? values.urls[index] : null;
    const modeFieldName = index !== null ? `urls[${index}].mode` : 'mode';

    useEffect(() => {
        if (index !== null && values.urls[index]) {
            snapshotRef.current = values.urls[index];
            setSuperAdvanced(secondTabModes.includes(values.urls[index].mode));
            setRegexError(undefined);
        }
    }, [index]);

    const handleSelectMode = (mode: AutofillMode) => {
        if (index === null || !urlItem) return;

        void setFieldValue(`urls[${index}].mode`, mode);
        if (isPatternOrRegex(mode)) {
            // When switching to pattern or regex, remove the url in the value
            void setFieldValue(`urls[${index}].url`, '');
        } else if (isPatternOrRegex(urlItem.mode)) {
            // When switching back to an url, reuse the initial url
            // Or empty if it was not an url
            void setFieldValue(
                `urls[${index}].url`,
                isPatternOrRegex(snapshotRef.current?.mode ?? AutofillMode.Default) ? '' : snapshotRef.current?.url
            );
        }
    };

    const handleBlurValue = async () => {
        if (urlItem?.mode !== AutofillMode.RegularExpression) return;
        setRegexError(getRegexError(urlItem.url));
    };

    const handleCancel = () => {
        if (index !== null && snapshotRef.current) {
            void setFieldValue(
                'urls',
                values.urls.map((item, i) => (i === index ? snapshotRef.current! : item))
            );
        }
        modalProps.onClose?.();
    };

    const handleConfirm = () => {
        // Storage imposes that urls with default mode comes first
        // Applying that order as soon as possible to prevent a glitch later
        void setFieldValue('urls', sortDefaultFirst(values.urls));
        modalProps.onClose?.();
    };

    // We hide main input for patter and regex which have their own field
    const showMainInput =
        index !== null &&
        urlItem &&
        urlItem.mode !== AutofillMode.Pattern &&
        urlItem.mode !== AutofillMode.RegularExpression;

    return (
        <SidebarModal {...modalProps} open={open} onClose={handleCancel}>
            <Panel
                className="ui-violet"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="shrink-0"
                                icon
                                pill
                                shape="solid"
                                onClick={handleCancel}
                            >
                                <IcCross className="modal-close-icon" alt={c('Action').t`Close`} />
                            </Button>,
                            <Button
                                className="text-sm"
                                key="modal-submit-button"
                                disabled={!!regexError}
                                onClick={handleConfirm}
                                color="norm"
                                pill
                            >
                                {c('Action').t`Confirm`}
                            </Button>,
                        ]}
                    />
                }
            >
                <h3>{c('Title').t`URL matching`}</h3>
                <p>
                    {c('Title').t`Adjust autofill behaviors to change where logins are suggested.`}{' '}
                    <InlineLinkButton onClick={() => onLink('https://proton.me/support/url-matching')}>
                        {c('Title').t`Learn more`}
                    </InlineLinkButton>
                    .
                </p>

                {showMainInput && (
                    <InputField
                        {...getFieldProps(`urls[${index}].url`)}
                        inputClassName="color-norm rounded-none"
                        placeholder="https://proton.me/"
                    />
                )}

                <ButtonBar className="anime-fade-in shrink-0 mb-6" size="small">
                    <Button
                        onClick={() => setSuperAdvanced(false)}
                        selected={!superAdvanced}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {c('Label').t`Basic`}
                    </Button>
                    <Button
                        onClick={() => setSuperAdvanced(true)}
                        selected={superAdvanced}
                        className="flex-auto text-semibold"
                        pill
                    >
                        {c('Label').t`Advanced`}
                    </Button>
                </ButtonBar>

                {!superAdvanced && urlItem && (
                    <>
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.Default}
                            onSelect={handleSelectMode}
                        />
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.Exact}
                            onSelect={handleSelectMode}
                        />
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.Never}
                            onSelect={handleSelectMode}
                        />
                    </>
                )}

                {superAdvanced && urlItem && (
                    <>
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.StartWith}
                            onSelect={handleSelectMode}
                        />
                        {urlItem.mode === AutofillMode.StartWith && (
                            <div className="pl-6 pb-4">
                                <Banner variant="danger">{getModeWarning(AutofillMode.StartWith)}</Banner>
                            </div>
                        )}
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.Pattern}
                            onSelect={handleSelectMode}
                        />
                        {urlItem.mode === AutofillMode.Pattern && (
                            <div className="pl-6 pb-4">
                                <InputField
                                    {...getFieldProps(`urls[${index}].url`)}
                                    inputClassName="color-norm rounded-none"
                                    placeholder="https://sub*.proton.me/*"
                                />
                            </div>
                        )}
                        {/* Keep showing (disabled) an existing `RegularExpression` rule when the flag is
                         * off, instead of hiding it: an unselected radio list would look like no mode
                         * is set, tempting an edit to silently overwrite the actual rule. */}
                        {(regexEnabled || urlItem.mode === AutofillMode.RegularExpression) && (
                            <>
                                <ModeCheckbox
                                    fieldName={modeFieldName}
                                    currentMode={urlItem.mode}
                                    mode={AutofillMode.RegularExpression}
                                    onSelect={handleSelectMode}
                                    disabled={!regexEnabled}
                                />
                                {urlItem.mode === AutofillMode.RegularExpression && (
                                    <div className="pl-6 pb-4">
                                        <Banner variant="danger">
                                            {getModeWarning(AutofillMode.RegularExpression)}
                                        </Banner>
                                        <InputField
                                            {...getFieldProps(`urls[${index}].url`)}
                                            rootClassName="mt-2"
                                            inputClassName="color-norm rounded-none"
                                            error={regexError}
                                            placeholder="subdomain\\d*\\.proton\\.me"
                                            onBlur={handleBlurValue}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        <ModeCheckbox
                            fieldName={modeFieldName}
                            currentMode={urlItem.mode}
                            mode={AutofillMode.ExactPath}
                            onSelect={handleSelectMode}
                        />
                    </>
                )}

                <hr />

                <UrlAdvancedHelp
                    key={index}
                    url={urlItem ?? { id: '', url: '', mode: AutofillMode.Default }}
                    initialUrl={initialTestUrl}
                    regexEnabled={regexEnabled}
                />
            </Panel>
        </SidebarModal>
    );
};
