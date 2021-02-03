import React, { useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    BackButtonModal,
    Button,
    Field,
    FooterModal,
    HeaderModal,
    InnerModal,
    Label,
    PrimaryButton,
    Row,
    TitleModal,
} from 'react-components';
import ExpirationTimeDropdown from './ExpirationTimeDropdown';
import DateTime from './DateTime';
import { getExpirationTime } from '../Drive/helpers';
import { EXPIRATION_DAYS } from '../../constants';

interface Props {
    hasExpirationTime: boolean;
    saving?: boolean;
    onSave: (duration: EXPIRATION_DAYS) => void;
    onBack: () => void;
    onClose?: () => void;
    modalTitleID: string;
}

function EditExpirationTimeState({ hasExpirationTime, saving, onBack, onSave, onClose, modalTitleID }: Props) {
    const [duration, setDuration] = useState(EXPIRATION_DAYS.NEVER);
    const [expirationTime, setExpirationTime] = useState<number | null>(null);

    const handleChangeExpirationDate = (duration: EXPIRATION_DAYS) => {
        setDuration(duration);

        const expirationTime = getExpirationTime(duration);
        setExpirationTime(expirationTime);
    };

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
                    <TitleModal id={modalTitleID}>{c('Title').t`Expiration date`}</TitleModal>
                </div>
            </HeaderModal>
            <form
                className="modal-content"
                onReset={onBack}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!hasExpirationTime && !duration) {
                        onBack();
                    } else {
                        onSave(duration);
                    }
                }}
            >
                <InnerModal>
                    <Alert>{c('Info').t`Change this link's expiration date.`}</Alert>
                    <Row>
                        <Label htmlFor="expiration-time-dropdown">{c('Label').t`Link expires`}</Label>
                        <Field className="w100">
                            <div className="flex flex-nowrap flex-align-items-center on-mobile-flex-column">
                                <span className="flex-item-fluid max-w50 on-mobile-max-w100">
                                    <ExpirationTimeDropdown value={duration} onChange={handleChangeExpirationDate} />
                                </span>
                                <span className="flex-item-noshrink inline-flex on-mobile-mt0-25">
                                    {expirationTime && (
                                        <span className="ml2 flex-item-noshrink on-mobile-ml0 inline-flex flex-row flex-nowrap">
                                            <span className="mr0-5">{c('Info').t`on`}</span>
                                            <DateTime key="expirationTime" value={expirationTime} />
                                        </span>
                                    )}
                                </span>
                            </div>
                        </Field>
                    </Row>
                </InnerModal>
                <FooterModal>
                    <Button type="reset">{c('Action').t`Cancel`}</Button>
                    <PrimaryButton type="submit" loading={saving}>{c('Action').t`Update`}</PrimaryButton>
                </FooterModal>
            </form>
        </>
    );
}

export default EditExpirationTimeState;
