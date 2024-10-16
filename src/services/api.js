import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://34.93.135.235:6000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const initChat = async (threadId, message) => {
  try {
    const response = await api.post('/init-chat', { threadId, message });
    return response.data;
  } catch (error) {
    console.error('Error initializing chat:', error);
    throw error;
  }
};

export const getEvents = async (threadId) => {
  try {
    const response = await api.get(`/events/${threadId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const isUserInputRequired = async (threadId) => {
  try {
    const response = await api.get(`/user-input-required/${threadId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking if user input is required:', error);
    throw error;
  }
};

export const sendUserInput = async (threadId, input) => {
  try {
    const response = await api.post(`/send-user-input/${threadId}`, { input });
    return response.data;
  } catch (error) {
    console.error('Error sending user input:', error);
    throw error;
  }
};

export const terminateThread = async (threadId) => {
  try {
    const response = await api.post(`/terminate/${threadId}`);
    return response.data;
  } catch (error) {
    console.error('Error terminating thread:', error);
    throw error;
  }
};
