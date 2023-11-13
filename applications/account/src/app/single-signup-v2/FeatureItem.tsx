import { ReactNode } from 'react';

interface Props {
    left: ReactNode;
    text: ReactNode;
}

const FeatureItem = ({ left, text }: Props) => {
    return (
        <div className="on-mobile-flex-item-fluid flex flex-nowrap flex-align-items-center text-center flex-column md:flex-row flex-justify-start">
            <div className="md:mr-4 text-center">{left}</div>
            <div className="color-weak text-hyphens">{text}</div>
        </div>
    );
};

export default FeatureItem;
