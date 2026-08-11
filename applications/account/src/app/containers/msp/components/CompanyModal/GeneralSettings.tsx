import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Vr } from '@proton/atoms/Vr/Vr';
import { InputFieldTwo } from '@proton/components';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { useCompanyModalContext } from './context';

const GeneralSettings = () => {
    const { name, setName, seatsText, setSeatsText, assignedSeats, minSeats } = useCompanyModalContext();

    return (
        <>
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
                    <label className="text-semibold">{c('Label').t`Allocated licenses`}</label>
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
                                aria-label={c('Action').t`Decrease licenses`}
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
                                aria-label={c('Action').t`Increase licenses`}
                            >
                                <IcPlus size={4} />
                            </Button>
                        </div>
                        <span>{c('Info').t`${BRAND_NAME} Pass Professional`}</span>
                    </div>
                </div>
                <p className="m-0 color-weak msp-helper-text">
                    {c('Info')
                        .t`We bill you monthly by averaging the peak allocated licenses from each day over the month.`}
                </p>
            </div>
        </>
    );
};

export default GeneralSettings;
