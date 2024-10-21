import { TotpInput } from '@proton/components';

interface Props {
    value: string;
    onValue: (value: string) => void;
    onSubmit: (value: string) => void;
}

const AuthDeviceConfirmCodeInput = ({ value, onSubmit, onValue }: Props) => {
    return (
        <div className="flex justify-center relative">
            <div data-testid="confirm:item" className="w-2/3">
                <TotpInput
                    autoFocus={true}
                    centerDivider={false}
                    value={value}
                    onValue={(newValue) => {
                        const code = newValue.toUpperCase();
                        const safeCode = code.replaceAll(/\s+/g, '');
                        onValue(safeCode);
                        const lastCharacterChanged = value[3] !== safeCode[3];
                        if (safeCode.length === 4 && lastCharacterChanged) {
                            onSubmit(safeCode);
                        }
                    }}
                    length={4}
                    type="alphabet"
                />
            </div>
        </div>
    );
};
export default AuthDeviceConfirmCodeInput;
