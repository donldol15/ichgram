import { apiRequest } from './api';

export const getPosts = async () => {
    const data = await apiRequest('/posts');
    return data.posts;
};

export const createPost = async (formData) => {
    return apiRequest('/posts', {
        method: 'POST',
        body: formData
    });
};

export const deletePost = async (postId) => {
    return apiRequest(`/posts/${postId}`, {
        method: 'DELETE'
    });
};
