import Icon from '../icon/Icon';

interface StrippedItemProps {
    icon: string;
    children: React.ReactNode;
}

const StrippedItem = ({ icon, children }: StrippedItemProps) => {
    return (
        <div className="flex flex-align-items-center">
            <div className="mr1 color-success">
                <Icon size={24} name={icon} />
            </div>
            <span>{children}</span>
        </div>
    );
};

export default StrippedItem;
