import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';

import App from './App.jsx';
import GlobalLoader from './components/GlobalLoader';
import './i18n';
import './index.css';
import { store } from './store';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <GlobalLoader />
      <Toaster richColors position="top-right" />
    </Provider>
  </React.StrictMode>,
);
