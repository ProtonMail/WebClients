import { Button } from '@proton/atoms/Button';

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
