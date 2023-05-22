import { ReactNode } from 'react';

interface Props {
    left: ReactNode;
    text: string;
}

const FeatureItem = ({ left, text }: Props) => {
    return (
        <div className="flex flex-align-items-center text-center on-mobile-flex-column flex-justify-center">
            <div className="md:mr-4 text-center">{left}</div>
            <div className="color-weak">{text}</div>
        </div>
    );
};

export default FeatureItem;
