import React , {useState,useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {useSocket} from '../provider/socket'
const Homepage =()=>{
    const socket = useSocket();
    const [email,setEmail] = useState('');
    const [RoomId , setRoomId] = useState('');
    const navigate = useNavigate();
    const handlejoinedroom = ({RoomId})=>{
        navigate(`/room/${RoomId}`)
    }
    useEffect(() => {
        socket.on('joined-room', handlejoinedroom);
        return () => socket.off('joined-room', handlejoinedroom);
    }, [socket]);
    const handlejoinroom =()=>{
        socket.emit('join-room',{emailId:email , RoomId:RoomId});
    }
return(
    <div className = 'homepage-conatiner'>
        <div>
            <input value ={email} onChange ={e=>setEmail(e.target.value)}  type='email'placeholder = 'your email'/>
            <input value ={RoomId} onChange ={e=>setRoomId(e.target.value)} type='text'placeholder = 'your RoomId'/>
            <button onClick = {handlejoinroom}>Enter Room</button>
        </div>
    </div>
)
}
export default Homepage