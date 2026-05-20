import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../api/client';

const token = localStorage.getItem('temple-token');
const user = JSON.parse(localStorage.getItem('temple-user') || 'null');

export const login = createAsyncThunk('auth/login', async (values, thunkApi) => {
  try {
    const response = await api.post('/auth/login', values);
    return response.data.data;
  } catch (error) {
    return thunkApi.rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const loadCurrentUser = createAsyncThunk('auth/loadCurrentUser', async (_, thunkApi) => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    return thunkApi.rejectWithValue(error.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token,
    user,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('temple-token');
      localStorage.removeItem('temple-user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem('temple-token', action.payload.token);
        localStorage.setItem('temple-user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('temple-token');
        localStorage.removeItem('temple-user');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
