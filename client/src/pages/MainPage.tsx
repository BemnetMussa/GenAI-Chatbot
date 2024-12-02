import React, { useState } from 'react'
import ChatContainer from '../components/ChatContainer'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

type Props = {}

const MainPage = () => {
  const { id } = useParams();
  const [userName, setUserName] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/user/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        const data = await response.json();

        setUserName(data.name);
        console.log(data.conversations)
        setChatHistory(data.conversations);

      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Unable to load user information.');
      }
    };

    fetchUserInfo();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!userName) return <p>Loading...</p>; 
  

  return (
    <>
        <div className="flex h-screen">
      <div className="w-64 bg-blue-600 p-4 flex flex-col">
        <div className="flex-1">
          <div className="text-white text-lg font-semibold mb-8">GenAI</div>
          <hr className="pb-6  border-white opacity-40"/>
          <div className="pb-6 text-white/50">Chat history</div>
          <div className="space-y-4 pl-2">
            <div className="text-white/60">Hi genAi</div>
            <div className="text-white/60">Explain cosmic theory</div>
            <div className="text-white/60">Explain quantum physics</div>
          </div>
        </div>

        <div className="mt-auto">
          <hr className="pb-6  border-white opacity-40"/>
          <button onClick={() => window.location.href = 'http://localhost:5000/logout'}
                  className="flex m-auto gap-6 text-xl pb-5 text-white">
            <span>Log out</span>
             <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 m-auto "
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className='flex  border-b justify-between'>
          <div className="p-4">
            <h1 className="text-lg font-semibold text-gray-800 w-64">Generative AI Chatbot</h1>
          </div>

          <div className='flex gap-2 m-auto  w-full items-center justify-end pr-5 place-self-end'>
            <p>{userName}</p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
        </div>

        <ChatContainer />

      </div>
    </div>
    </>
  )
}


export default MainPage;