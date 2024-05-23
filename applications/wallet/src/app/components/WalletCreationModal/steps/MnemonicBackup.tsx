import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { Button } from '../../../atoms';
import { ImportantNotice } from './ImportantNotice';

import './MnemonicBackup.scss';

interface Props {
    mnemonic: WasmMnemonic;
    onContinue: () => void;
    isLastStep: boolean;
}

export const MnemonicBackup = ({ isLastStep, mnemonic, onContinue }: Props) => {
    const mnemonicWords = mnemonic?.asWords();

    return (
        <div className="flex flex-column">
            <div className="mnemonic-grid px-8">
                {mnemonicWords?.map((word, index) => {
                    const middle = Math.ceil(mnemonicWords.length / 2);
                    const gridColumn = index < middle ? 1 : 2;
                    const gridRow = index < middle ? index + 1 : index + 1 - middle;

                    return (
                        <div
                            className={clsx('flex flex-row text-lg items-center', gridRow > 1 && 'border-top')}
                            key={`${index}_${word}`}
                            style={{ gridRow, gridColumn }}
                        >
                            <div className="color-hint">{index + 1}</div>
                            <div className="ml-6">{word}</div>
                        </div>
                    );
                })}
            </div>

            <ImportantNotice
                text={`Store your seed phrase securely; without it, ${BRAND_NAME} cannot recover your funds.`}
            />

            <Button className="block w-4/5 mx-auto mt-6" shape="solid" color="norm" onClick={() => onContinue()}>
                {isLastStep ? c('Wallet setup').t`Done` : c('Wallet setup').t`Continue`}
            </Button>
        </div>
    );
};
