import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { WalletLogo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { SECOND } from '@proton/shared/lib/constants';

import { WasmMnemonic, WasmWordCount } from '../../../../pkg';
import { ColorGradientCard } from './ColorGradientCard';

import './MnemonicGeneration.scss';

interface Props {
    onGenerated: (mnemonic: WasmMnemonic) => void;
}

const getRandomNumber = (min: number, max: number): number => {
    const rand = Math.random() * (max - min) + min;
    const power = Math.pow(10, 2);
    return Math.floor(rand * power) / power;
};

const getRandomArrayElement = <T,>(array: T[]): T => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
};

const SPARKLE_SIZES = [9, 11, 13, 15, 17];
const SPARKLE_COLORS = ['#FFFFFF80', '#FFFFFF4D', '#FFFFFF1A', '#FFFFFF'];

const Sparkle = () => {
    const top = getRandomNumber(0, 100);
    const size = getRandomArrayElement(SPARKLE_SIZES);
    const color = getRandomArrayElement(SPARKLE_COLORS);

    const duration = getRandomNumber(2, 4);
    const delay = getRandomNumber(0, 2);

    return (
        <div
            className="absolute top-custom left-custom h-custom w-custom"
            style={{
                '--top-custom': `calc(${top}% - ${size}px)`,
                '--left-custom': `-${size}px`,
                '--w-custom': `${size}px`,
                '--h-custom': `${size}px`,
                background: color,
                animation: `moveSlow ${duration}s linear ${delay}s infinite`,
            }}
        ></div>
    );
};

export const MnemonicGeneration = ({ onGenerated }: Props) => {
    const mnemonicRef = useRef<WasmMnemonic | null>();

    useEffect(() => {
        mnemonicRef.current = new WasmMnemonic(WasmWordCount.Words12);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (mnemonicRef.current) {
                onGenerated(mnemonicRef.current);
            }
        }, 5 * SECOND);

        return () => clearTimeout(timeout);
    }, [onGenerated]);

    return (
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column flex-nowrap">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Creating your wallet`}</span>

                <ColorGradientCard width={24}>
                    {new Array(40).fill(null).map((_, index) => (
                        <Sparkle key={`sparkle_${index}`} />
                    ))}

                    <div
                        className="flex flex-row items-center m-auto upper-layer p-2 rounded"
                        style={{ backdropFilter: 'blur(10px)' }}
                    >
                        <WalletLogo variant="glyph-only" className="mr-1" />
                        <span className="text-semibold text-rg">{c('Wallet setup').t`Generating...`}</span>
                    </div>
                </ColorGradientCard>

                <p className="my-0 block text-center color-weak">{c('Wallet setup')
                    .t`Crafting a secure wallet with cryptographic entropy`}</p>

                <Button disabled className="mt-8">{c('Wallet setup').t`Back up your wallet`}</Button>
            </div>
        </ModalContent>
    );
};
