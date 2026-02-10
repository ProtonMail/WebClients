import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';

interface Props {
    showProtonLogo: boolean;
}

const LiteLoaderPage = ({ showProtonLogo }: Props) => {
    return (
        <div className="flex justify-center flex-column items-center h-full gap-6">
            {showProtonLogo && <ProtonLogo />}
            <CircleLoader className="color-primary" size="medium" />
        </div>
    );
};

export default LiteLoaderPage;
