import React, { useState } from 'react';
import {
    Alert,
    BackButtonModal,
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
                className="flex flex-items-center"
                onClose={onClose}
                hasClose={!saving}
                modalTitleID={modalTitleID}
            >
                <div className="flex flex-items-center">
                    <BackButtonModal onClick={onBack} />
                    <TitleModal id={modalTitleID}>{c('Title').t`Password protection`}</TitleModal>
                </div>
            </HeaderModal>
            <form
                className="pm-modalContent"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!isSaveDisabled) {
                        onSave(password);
                    }
                }}
            >
                <InnerModal>
                    <Alert>{c('Info').t`Type a new password below.`}</Alert>

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
                    <PrimaryButton disabled={isSaveDisabled} type="submit" loading={saving}>{c('Action')
                        .t`Update`}</PrimaryButton>
                </FooterModal>
            </form>
        </>
    );
}

export default EditPasswordState;
