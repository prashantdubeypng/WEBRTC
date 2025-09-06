import './App.css';
import { SocketProvider } from './provider/socket'; 
import {Routes , Route} from 'react-router-dom'
import {PeerProvider} from './provider/peer'
import LandingPage from './pages/Landing';
import Homepage from './pages/home'
import Roompage from './pages/Room'
function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProvider>
      <Routes>
<Route path = '/' element={<LandingPage/>}/>
<Route path = '/home' element={<Homepage/>}/>
<Route path = '/room/:RoomId' element={<Roompage/>}/>
      </Routes>
      </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
