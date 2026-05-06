const DEFAULT_API_PORT = process.env.REACT_APP_API_PORT || '5000';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const resolveApiUrlForCurrentHost = (apiUrl) => {
    if (!apiUrl || typeof window === 'undefined') {
        return apiUrl;
    }

    try {
        const parsedUrl = new URL(apiUrl);
        const currentHostname = window.location.hostname || 'localhost';

        if (LOCAL_HOSTNAMES.has(parsedUrl.hostname) && !LOCAL_HOSTNAMES.has(currentHostname)) {
            parsedUrl.hostname = currentHostname;
        }

        return parsedUrl.toString().replace(/\/$/, '');
    } catch (_error) {
        return apiUrl;
    }
};

export const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return resolveApiUrlForCurrentHost(process.env.REACT_APP_API_URL);
    }

    if (typeof window === 'undefined') {
        return `http://localhost:${DEFAULT_API_PORT}/api`;
    }

    const { protocol, hostname } = window.location;
    const resolvedProtocol = protocol === 'https:' ? 'https:' : 'http:';
    const resolvedHostname = hostname || 'localhost';

    return `${resolvedProtocol}//${resolvedHostname}:${DEFAULT_API_PORT}/api`;
};

export const getServerBaseUrl = () => getApiBaseUrl().replace(/\/api\/?$/, '');
