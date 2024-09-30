import type { ReactNode } from 'react';

type Props = {
    title: string;
    subtitle: string;
    children: ReactNode;
    image?: string;
    rightContent?: ReactNode;
};
export const Container = ({ title, subtitle, children, image, rightContent }: Props) => {
    return (
        <div className="flex flex-column-reverse sm:flex-row mt-8 gap-2 flex-nowrap">
            <div className="sm:w-1/2 flex flex-column justify-center items-start grow-0">
                <span className="text-uppercase color-primary">{subtitle}</span>
                <h2 className="mt-4 text-bold text-4xl">{title}</h2>
                {children}
            </div>
            <div className="sm:w-1/2 ratio-square flex items-center justify-center">
                {image ? <img src={image} alt="" /> : null}
                {rightContent}
            </div>
        </div>
    );
};
