import Loader from '@proton/components/components/loader/Loader';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

const FeatureTourLoader = () => (
    <ModalContent
        className="m-8 text-center min-h-custom flex items-center justify-center"
        style={{ '--min-h-custom': '32rem' }}
    >
        <Loader size="small" className="color-primary" />
    </ModalContent>
);

export default FeatureTourLoader;
