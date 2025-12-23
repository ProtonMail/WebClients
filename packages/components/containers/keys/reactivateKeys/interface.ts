import type { KeyReactivationRequestState } from '@proton/shared/lib/keys';

export interface ReactivateKeysContentProps {
    keyReactivationStates: KeyReactivationRequestState[];
    loading: boolean;
    onLoading: (value: boolean) => void;
    onClose?: () => void;
}
