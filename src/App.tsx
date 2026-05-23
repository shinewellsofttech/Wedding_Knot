import { ToastContainer } from 'react-toastify';
import { UserRightsProvider } from './contexts/UserRightsContext';
import RouterData from './Routes';

function App() {
  return (
    <UserRightsProvider>
      <RouterData />
      <ToastContainer />
    </UserRightsProvider>
  );
}

export default App;
