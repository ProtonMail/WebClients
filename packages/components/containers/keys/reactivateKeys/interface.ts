import type { KeyReactivationRequestState } from '@proton/shared/lib/keys/reactivation/interface';

export interface ReactivateKeysContentProps {
    keyReactivationStates: KeyReactivationRequestState[];
    loading: boolean;
    onLoading: (value: boolean) => void;
    onClose?: () => void;
}
