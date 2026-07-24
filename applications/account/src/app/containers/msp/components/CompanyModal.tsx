import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Vr } from '@proton/atoms/Vr/Vr';
import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { CompanyFormData, MspCompany } from '../types';

import './MspCompaniesSection.scss';

interface Props {
    mode: 'add' | 'edit';
    initial?: MspCompany;
    onSave: (data: CompanyFormData) => Promise<void>;
    onClose: () => void;
}

const CompanyModal = ({ mode, initial, onSave, onClose }: Props) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [seatsText, setSeatsText] = useState(String(initial?.assignedSeats ?? 1));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const minSeats = Math.max(1, initial?.usedSeats ?? 0);
    const assignedSeats = Math.max(minSeats, parseInt(seatsText, 10) || minSeats);
    const title = mode === 'add' ? c('Title').t`Add company` : c('Title').t`Edit company`;

    const handleSubmit = async () => {
        if (isSubmitting || !name.trim() || assignedSeats < minSeats) {
            return;
        }
        setIsSubmitting(true);
        try {
            await onSave({
                name: name.trim(),
                assignedSeats,
                status: initial?.status ?? 'active',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={title} subline={c('Info').t`Set the name, status, and assigned seats`} />
            <ModalTwoContent>
                <InputFieldTwo
                    className="mb-6"
                    label={c('Label').t`Company name`}
                    placeholder={c('Placeholder').t`Enter company name`}
                    value={name}
                    onValue={setName}
                    autoFocus
                />

                <div className="flex flex-column gap-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-semibold">{c('Label').t`Assigned seats`}</label>
                        <div className="flex items-center gap-4">
                            <div
                                className="flex items-center gap-1 p-1 rounded-lg border border-norm w-custom"
                                style={{ '--w-custom': '8rem' }}
                            >
                                <Button
                                    shape="ghost"
                                    icon
                                    size="small"
                                    disabled={assignedSeats <= minSeats}
                                    onClick={() => setSeatsText(String(assignedSeats - 1))}
                                    aria-label={c('Action').t`Decrease`}
                                >
                                    <IcMinus size={4} />
                                </Button>
                                <Vr className="msp-stepper-divider" />
                                <input
                                    type="number"
                                    min={minSeats}
                                    value={seatsText}
                                    onChange={(e) => setSeatsText(e.target.value)}
                                    onBlur={() => setSeatsText(String(assignedSeats))}
                                    className="msp-seats-input"
                                />
                                <Vr className="msp-stepper-divider" />
                                <Button
                                    shape="ghost"
                                    icon
                                    size="small"
                                    onClick={() => setSeatsText(String(assignedSeats + 1))}
                                    aria-label={c('Action').t`Increase`}
                                >
                                    <IcPlus size={4} />
                                </Button>
                            </div>
                            <span>{c('Info').t`${BRAND_NAME} Pass Professional`}</span>
                        </div>
                    </div>
                    <p className="m-0 color-weak msp-helper-text">
                        {c('Info').t`You'll be billed monthly based on the average number of assigned seats.`}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={isSubmitting}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !name.trim()}
                >
                    {mode === 'add' ? c('Action').t`Add` : c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CompanyModal;
