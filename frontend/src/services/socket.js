import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: true,
});

export const subscribeToStock = (symbol, callback) => {
    socket.on('stockUpdate', (data) => {
        if (!symbol || data.symbol === symbol) {
            callback(data);
        }
    });
};

export const unsubscribeFromStock = () => {
    socket.off('stockUpdate');
};
