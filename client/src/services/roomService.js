import api from './api';

export const createRoom = (language) => api.post('/api/rooms', { language });
export const joinRoom = (roomCode) => api.post(`/api/rooms/${roomCode}/join`);
export const getRoom = (roomCode) => api.get(`/api/rooms/${roomCode}`);