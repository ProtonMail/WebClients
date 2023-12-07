import { WasmUtxo } from '../../pkg';

export interface Recipient {
    address: string;
    amount: number;
}

export interface AdvancedOptions {
    coinSelection: string;
    selectedCoins?: WasmUtxo[];
    enableRBF: boolean;
    useLocktime: boolean;
    locktimeValue: number;
    changePolicy: string;
}
