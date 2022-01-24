import {
    createContext,
    DetailedHTMLProps,
    FormHTMLAttributes,
    ReactNode,
    useState,
    Dispatch,
    SetStateAction,
} from 'react';

interface TooltipContextProps {
    tooltip: string;
    setTooltip: Dispatch<SetStateAction<string>>;
}

export const TooltipContext = createContext<TooltipContextProps>({ tooltip: '', setTooltip: () => {} });

const TooltipProvider = ({ children }: { children: ReactNode }) => {
    const [tooltip, setTooltip] = useState('');

    return <TooltipContext.Provider value={{ tooltip, setTooltip }}>{children}</TooltipContext.Provider>;
};

interface FormContextProps {
    dense: boolean;
}

export const FormContext = createContext<FormContextProps>({ dense: false });

type FormProps = DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & Partial<FormContextProps>;

const Form = ({ dense = false, children, ...props }: FormProps) => {
    return (
        <TooltipProvider>
            <FormContext.Provider value={{ dense }}>
                <form
                    method="post"
                    {...props}
                    onSubmit={(event) => {
                        event.preventDefault();
                        props.onSubmit?.(event);
                    }}
                >
                    {children}
                </form>
            </FormContext.Provider>
        </TooltipProvider>
    );
};

export default Form;
