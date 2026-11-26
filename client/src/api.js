const API_URL = 'http://localhost:5000';

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
};

export default API_URL;
