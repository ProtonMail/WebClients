import { ReactNode } from 'react';

interface Props {
    children: ReactNode[];
}

export const StackedFields = ({ children }: Props) => {
    return (
        <div className="flex flex-column y-4 bg-weak rounded-xl">
            {children.map((field, index) => (
                <>
                    {index > 0 && <hr className="my-0" />}
                    {field}
                </>
            ))}
        </div>
    );
};
