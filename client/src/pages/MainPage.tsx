import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatContainer from '../components/ChatContainer';
import ChatHistory from '../components/ChatHistory';

const MainPage = () => {
  const { id } = useParams();
  const [userName, setUserName] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState('');
  const [messageId, setMessageId] = useState<string | null>(null);
 

  const handleMessageId = (id: string) => {
    setMessageId(id);
    console.log('Received messageId:', id);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!messageId) {
          const newChatResponse = await fetch(`http://localhost:5000/chat/new/${id}`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (!newChatResponse.ok) {
            throw new Error('Failed to create new chat');
          }
          
          const newChatData = await newChatResponse.json();
          setUserName(newChatData.name)
     
          return;
        }

        const historyResponse = await fetch(`http://localhost:5000/user/history/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ messageId })
        });

        if (!historyResponse.ok) {
          const errorData = await historyResponse.json();
          throw new Error(errorData.message || 'Failed to fetch user details');
        }

        const historyData = await historyResponse.json();
        console.log(historyData.data.messages)
        setChatHistory(historyData.data.messages);
   
      } catch (error) {
        console.error('Error:', error);
        setError('An error occurred');
      }
    };

    if (id) {
      fetchUserInfo();
    }
  }, [messageId, id]);


  if (error) return <p>{error}</p>;
  if (!userName) return <p>Loading...</p>; 

  return (
    <div className="flex h-screen">
      <ChatHistory onMessageIdChange={handleMessageId} />
      
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex border-b justify-between">
          <div className="p-4">
            <h1 className="text-lg font-semibold text-gray-800 w-64">
              Generative AI Chatbot
            </h1>
          </div>
          
          <div className="flex gap-2 m-auto w-full items-center justify-end pr-5 place-self-end">
            <p>{userName}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 ">
      
            <ChatContainer userName={userName}  chatHistory={chatHistory} messageId={messageId} />
          
        </div>
      </div>
    </div>
  );
};

export default MainPage;