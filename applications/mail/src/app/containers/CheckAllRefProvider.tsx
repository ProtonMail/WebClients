import { MutableRefObject, ReactNode, createContext, useContext, useRef } from 'react';

const CheckAllRefContext = createContext<MutableRefObject<((check: boolean) => void) | null>>(null as any);

/**
 * "Temporary" context used to store the "uncheck all list element" function
 * So that we are able to trigger it from the sidebar when doing a d&d with select all
 * Delete once we store the selected elements in Redux
 */
export const useCheckAllRef = () => {
    const checkAllRef = useContext(CheckAllRefContext);

    const setCheckAllRef = (value: (check: boolean) => void) => {
        checkAllRef.current = value;
    };

    return { checkAllRef, setCheckAllRef };
};

interface Props {
    children: ReactNode;
}
export const CheckAllRefProvider = ({ children }: Props) => {
    const onCheckAllRef = useRef<(check: boolean) => void>(null);

    return <CheckAllRefContext.Provider value={onCheckAllRef}>{children}</CheckAllRefContext.Provider>;
};
