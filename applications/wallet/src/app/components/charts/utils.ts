import { colors } from './constants';

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};

// TODO: remove `any` when wallet API is done and we have proper wallet interface
export const formatWalletToDoughnutChart = (wallets: any[]) => {
    const [labels, datasets] = wallets.reduce(
        ([accLabels, [accDataset]], wallet) => {
            const label = wallet.name;
            let color = getRandomColor();
            while (accDataset.backgroundColor.includes(color)) {
                color = getRandomColor();
            }

            return [
                [...accLabels, label],
                [
                    {
                        ...accDataset,
                        data: [...accDataset.data, wallet.balance],
                        backgroundColor: [...accDataset.backgroundColor, color],
                        borderColor: [...accDataset.borderColor, color],
                        cutout: '70%',
                    },
                ],
            ];
        },
        [[], [{ label: 'Balance', data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]]
    );

    return { labels, datasets };
};

// TODO: remove `any` when wallet API is done and we have proper wallet interface
export const formatWalletToLineChart = (lastYDaysBalances: any[], gradient: CanvasGradient | undefined) => {
    const [labels, datasets] = lastYDaysBalances.reduce(
        ([accLabels, [accDataset]], balance) => {
            const label = balance.date;

            return [
                [...accLabels, label],
                [
                    {
                        ...accDataset,
                        data: [...accDataset.data, balance.balance],
                        borderColor: '#704CFF',
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true,
                        backgroundColor: () => {
                            // Add color stops to the gradient
                            gradient?.addColorStop(0, '#E4DEFF');
                            gradient?.addColorStop(0.7, '#E4DEFF00');

                            return gradient ?? 'transparent';
                        },
                    },
                ],
            ];
        },
        [[], [{ label: 'Balance', data: [] }]]
    );

    return { labels, datasets };
};
