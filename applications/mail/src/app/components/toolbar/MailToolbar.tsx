interface Props {
    placement: 'list' | 'header';
}

export const MailToolbar = ({ placement }: Props) => {
    if (placement === 'list') {
        return <span>list toolbar</span>;
    }

    return <span>header toolbar</span>;
};
