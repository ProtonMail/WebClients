import type { Reducer } from 'react';
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useModalState } from '@proton/components';
import DeleteLabelModal from '@proton/components/containers/labels/modals/DeleteLabelModal';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import { getStandardFolders } from '../../helpers/labels';

type LabelType = 'label' | 'folder';

interface LabelActionsContext {
    createLabel: (type: LabelType) => void;
    editLabel: (type: LabelType, label: Label) => void;
    deleteLabel: (type: LabelType, label: Label) => void;
}

const referralContext = createContext<LabelActionsContext | undefined>(undefined);

export const useLabelActionsContext = () => {
    const context = useContext(referralContext);

    if (context === undefined) {
        throw new Error('Component should be wrapped inside LabelActionsContextProvider');
    }

    return context;
};

type State = {
    type: LabelType | undefined;
    label: Label | undefined;
    action: 'create' | 'edit' | 'delete' | undefined;
};

type Action =
    | { type: 'create'; payload: Pick<State, 'type'> }
    | { type: 'edit'; payload: Pick<State, 'label' | 'type'> }
    | { type: 'delete'; payload: Pick<State, 'label' | 'type'> }
    | { type: 'reset' };

const reducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'create':
            return { action: action.type, type: action.payload.type, label: undefined };
        case 'edit':
            return { action: action.type, ...action.payload };
        case 'delete':
            return { action: action.type, ...action.payload };
        case 'reset':
            return { action: undefined, label: undefined, type: undefined };
    }
};

export const LabelActionsContextProvider = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const history = useHistory();
    const [{ type, label, action }, dispatch] = useReducer<Reducer<State, Action>>(reducer, {
        type: undefined,
        label: undefined,
        action: undefined,
    });
    const [modalProps, openModal, renderModal] = useModalState();

    const resetContextAndCloseModal = useCallback(() => {
        dispatch({ type: 'reset' });
        modalProps.onClose();
    }, []);

    const contextProviderValue = useMemo(
        () => ({
            createLabel: (type: LabelType) => {
                dispatch({ type: 'create', payload: { type } });
                openModal(true);
            },
            editLabel: (type: LabelType, label: Label) => {
                dispatch({ type: 'edit', payload: { label, type } });
                openModal(true);
            },
            deleteLabel: (type: LabelType, label: Label) => {
                dispatch({ type: 'delete', payload: { label, type } });
                openModal(true);
            },
        }),
        []
    );

    const redirectToInbox = () => {
        const systemFolders = getStandardFolders();

        history.push(systemFolders[MAILBOX_LABEL_IDS.INBOX].to);
    };

    return (
        <referralContext.Provider value={contextProviderValue}>
            {children}

            {action === 'create' && renderModal && (
                <EditLabelModal
                    {...modalProps}
                    type={type}
                    mode="create"
                    onCloseCustomAction={resetContextAndCloseModal}
                />
            )}
            {action === 'edit' && renderModal && (
                <EditLabelModal
                    {...modalProps}
                    type={type}
                    mode="edition"
                    label={label}
                    onCloseCustomAction={resetContextAndCloseModal}
                />
            )}
            {action === 'delete' && renderModal && label && (
                <DeleteLabelModal
                    {...modalProps}
                    label={label}
                    onRemove={() => {
                        const userOnLabelPage = location.pathname.includes(label.ID);
                        if (userOnLabelPage) {
                            redirectToInbox();
                        }
                        resetContextAndCloseModal();
                    }}
                />
            )}
        </referralContext.Provider>
    );
};
