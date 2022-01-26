import { createContext, ComponentPropsWithoutRef } from 'react';

interface FormOwnProps {
    dense?: boolean;
}

export const FormContext = createContext<FormOwnProps>({});

export type FormProps = ComponentPropsWithoutRef<'form'> & FormOwnProps;

const Form = ({ dense, ...props }: FormProps) => {
    return (
        <FormContext.Provider value={{ dense }}>
            <form
                method="post"
                {...props}
                onSubmit={(event) => {
                    event.preventDefault();
                    props.onSubmit?.(event);
                }}
            />
        </FormContext.Provider>
    );
};

export default Form;
