import { Button } from '@proton/atoms/Button/Button';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';

export const BookingSidebarAction = () => {
    return (
        <SimpleDropdown as={Button} size="large" color="norm" icon group>
            <p>Hello</p>
        </SimpleDropdown>
    );
};
