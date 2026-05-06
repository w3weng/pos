import { getServerBaseUrl } from './apiConfig';

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

export const calculateChange = (paid, total) => {
    return Math.max(0, paid - total);
};

export const calculateTax = (subtotal, taxRate) => {
    return (subtotal * taxRate) / 100;
};

export const truncateText = (text, length = 30) => {
    return text?.length > length ? text.substring(0, length) + '...' : text;
};

export const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return '';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    const serverBaseUrl = getServerBaseUrl();

    return imageUrl.startsWith('/') ? `${serverBaseUrl}${imageUrl}` : `${serverBaseUrl}/${imageUrl}`;
};
