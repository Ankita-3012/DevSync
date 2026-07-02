import api from './api';

export const getComments = (roomCode) => api.get(`/api/rooms/${roomCode}/comments`);
export const createComment = (roomCode, data) => api.post(`/api/rooms/${roomCode}/comments`, data);
export const getAIReview = (roomCode) => api.get(`/api/rooms/${roomCode}/ai-review`);