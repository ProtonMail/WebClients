import { Button } from '@proton/atoms';

interface Props {
    ctaText: string;
    onClick: () => void;
}

const ReminderCTA = ({ ctaText, onClick }: Props) => {
    return (
        <Button onClick={onClick} fullWidth color="norm">
            {ctaText}
        </Button>
    );
};

export default ReminderCTA;
