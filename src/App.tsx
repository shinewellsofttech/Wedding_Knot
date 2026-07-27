import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserRightsProvider } from './contexts/UserRightsContext';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import RouterData from './Routes';

function App() {
  useEffect(() => {
    // Prevent Up and Down arrow keys from changing numeric input values
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
        e.target instanceof HTMLInputElement &&
        e.target.type === 'number'
      ) {
        e.preventDefault();
      }
    };

    // Prevent mouse wheel from changing focused numeric input values
    const handleGlobalWheel = (e: WheelEvent) => {
      if (
        e.target instanceof HTMLInputElement &&
        e.target.type === 'number' &&
        document.activeElement === e.target
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true } as any);
      window.removeEventListener('wheel', handleGlobalWheel, { capture: true } as any);
    };
  }, []);

  return (
    <UserRightsProvider>
      <OrderNotificationProvider>
        <RouterData />
        <ToastContainer />
      </OrderNotificationProvider>
    </UserRightsProvider>
  );
}

export default App;
