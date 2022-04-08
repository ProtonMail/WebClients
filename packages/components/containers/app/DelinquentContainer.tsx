import DelinquentModal from '../api/DelinquentModal';
import { ProminentContainer } from '../../components';

const DelinquentContainer = () => {
    return (
        <ProminentContainer>
            <DelinquentModal open />
        </ProminentContainer>
    );
};

export default DelinquentContainer;
