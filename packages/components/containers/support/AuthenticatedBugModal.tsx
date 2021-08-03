import { useAddresses, useUser } from '../../hooks';
import BugModal from './BugModal';

interface Props {
    onClose?: () => void;
}

const AuthenticatedBugModal = (props: Props) => {
    const [{ Name = '' }] = useUser();
    const [addresses = []] = useAddresses();
    return <BugModal username={Name} addresses={addresses} {...props} />;
};

export default AuthenticatedBugModal;
