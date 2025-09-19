import axios from 'axios';

// Update this with your actual backend URL (use your machine's IP for local network access)
const API_BASE_URL = 'http://localhost:8000';

export const startFactCheck = async (text, pipeline = "fact") => {
  try {
    const response = await axios.post(`${API_BASE_URL}/fact-check/`, {
      text,
      pipeline
    });
    return response.data;
  } catch (error) {
    console.error('Error starting fact check:', error);
    throw error;
  }
};

export const getStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting status:', error);
    throw error;
  }
};

export const getLogs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/logs`);
    return response.data;
  } catch (error) {
    console.error('Error getting logs:', error);
    throw error;
  }
};

export const getResults = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/results`);
    return response.data;
  } catch (error) {
    console.error('Error getting results:', error);
    throw error;
  }
};
