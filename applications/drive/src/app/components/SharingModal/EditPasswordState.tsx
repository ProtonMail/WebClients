import React, { useState } from 'react';
import {
    Alert,
    BackButtonModal,
    Button,
    Field,
    FooterModal,
    HeaderModal,
    InnerModal,
    Input,
    Label,
    PrimaryButton,
    Row,
    TitleModal,
} from 'react-components';
import { c } from 'ttag';
import { validateSharedURLPassword } from '../../utils/validation';

interface Props {
    saving?: boolean;
    initialPassword: string;
    onSave: (password: string) => void;
    onBack: () => void;
    onClose?: () => void;
    modalTitleID: string;
}

function EditPasswordState({ modalTitleID, onBack, onSave, onClose, saving, initialPassword }: Props) {
    const [password, setPassword] = useState(initialPassword);

    const isSaveDisabled = !password;

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const validationError = validateSharedURLPassword(password);

    return (
        <>
            <HeaderModal
                className="flex flex-align-items-center"
                onClose={onClose}
                hasClose={!saving}
                modalTitleID={modalTitleID}
            >
                <div className="flex flex-align-items-center">
                    <BackButtonModal onClick={onBack} />
                    <TitleModal id={modalTitleID}>{c('Title').t`Change password`}</TitleModal>
                </div>
            </HeaderModal>
            <form
                className="modal-content"
                onReset={onBack}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (initialPassword === password) {
                        onBack();
                    } else if (!isSaveDisabled) {
                        onSave(password);
                    }
                }}
            >
                <InnerModal>
                    <Alert>{c('Info')
                        .t`Changing the original password makes password protection mandatory. You won't be able to remove password protection anymore.`}</Alert>

                    <Row>
                        <Label htmlFor="shared-url-password">{c('Label').t`New password`}</Label>
                        <Field>
                            <Input
                                id="shared-url-password"
                                autoFocus
                                placeholder={c('Placeholder').t`Enter a password`}
                                value={password}
                                onChange={handleChangePassword}
                                error={validationError}
                                required
                            />
                        </Field>
                    </Row>
                </InnerModal>
                <FooterModal>
                    <Button type="reset">{c('Action').t`Cancel`}</Button>
                    <PrimaryButton disabled={isSaveDisabled} type="submit" loading={saving}>{c('Action')
                        .t`Change password`}</PrimaryButton>
                </FooterModal>
            </form>
        </>
    );
}

export default EditPasswordState;
