import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormEvent } from 'react';

interface Message {
  content: string;
  sender: string;
  timestamp?: Date;
}

interface Conversation {
  messages: Message[];
  _id: string
}

interface ChatHistoryProps {
  onMessageIdChange: (messageId: string) => void;
}


const ChatHistory: React.FC<ChatHistoryProps> = ({ onMessageIdChange }) => {
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id: userId } = useParams();
  const navigate = useNavigate();


  useEffect(() => {      
    const fetchChatHistory = async () => {
      try {
        if (!userId) {
          setError('User ID not found');
          return;
        }

        const response = await fetch(`http://localhost:5000/chat/history/${userId}`, {
          credentials: 'include',
        });


        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const data = await response.json();
        setChatHistory(data.conversations || []);
      } catch (err) {
        setError('Error loading chat history');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [userId]);

  

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/logout', {
    
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNewConversation = async () => {
   const respond =  await fetch(`http://localhost:5000/chat/new/${userId}`, {
        method: 'POST',
        credentials: 'include',
    });

    const data = respond.json();
    console.log(data)
  };



    const handleSend = async (messageId: string) => {
        console.log("Selected message ID:", messageId);
        

        onMessageIdChange(messageId);
    };


  return (
    <div className="w-64 bg-blue-600 p-4 flex flex-col h-screen">
      <div className="flex-1">
        <div className="text-white text-lg font-semibold mb-8">GenAI</div>
        <hr className="pb-6 border-white opacity-40" />
        <div className="pb-6 text-white/50">Chat history</div>

        <div className="space-y-4 pl-2 overflow-y-auto max-h-[calc(100vh-250px)]">
          {loading ? (
            <div className="text-white/60">Loading...</div>
          ) : error ? (
            <div className="text-red-300">{error}</div>
          ) : chatHistory.length === 0 ? (
            <div className="text-white/60">No chat history yet</div>
          ) : (
            chatHistory.map((conversation, index) => (
              <div key={index} className="text-white/60">
             
                  <div className="pl-4 space-y-2" >
                    
                      <div 
                        onClick={() =>
                            handleSend(
                                conversation.messages.length > 0 ? conversation._id : ''
                            )
                        }
                        className={`truncate`}>
                        {conversation.messages.length > 0 
                        ? conversation.messages[0].content // Access the content of the first message
                        : "No messages available"}
                        
                      </div>
                
                  </div>
          
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto">
        <hr className="pb-6 border-white opacity-40" />
        <button
          onClick={handleNewConversation}
          className="w-full bg-blue-500 text-white py-2 rounded-md mb-4 hover:bg-blue-400"
        >
          Start New Conversation
        </button>
        <button
          onClick={handleLogout}
          className="flex m-auto gap-6 text-xl pb-5 text-white hover:text-white/80 transition-colors"
        >
          <span>Log out</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 m-auto"
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
  );
};

export default ChatHistory ;
