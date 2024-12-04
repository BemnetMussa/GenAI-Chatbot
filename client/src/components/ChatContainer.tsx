
import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface Message {
  request: string;
  response: string;
}

interface MessageObject {
  _id: string;         
  content: string;     
  sender: string;
  timestamp: Date;
}

interface ChatContainerProps {
  chatHistory: MessageObject[];
  messageId: String | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({chatHistory, messageId}) => {
  const { id: userId } = useParams();
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState<MessageObject[]>([]);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversations(chatHistory);
  }, [chatHistory]);

  async function submitQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (!question.trim()) return;

      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userId, messageId  }),
      });

      if (!response.ok) {
        setError('Error occurred. Try again later');
        return;
      }

      const data = await response.json();

      // Create new message objects for both question and response
      const newUserMessage: MessageObject = {
        _id: Date.now().toString(), // Generate unique ID
        content: question,
        sender: 'user',
        timestamp: new Date()
      };

      const newAIMessage: MessageObject = {
        _id: (Date.now() + 1).toString(), // Generate unique ID offset by 1
        content: data.aiResponse,
        sender: 'assistant',
        timestamp: new Date()
      };

      setConversations(prev => [...prev, newUserMessage, newAIMessage]);
      setError('');
    } catch (error) {
      console.log(error);
      setError('Error while fetching');
    }

    setQuestion('');
  }



  // Scroll to the bottom when conversations update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

 return (
    <div className="flex flex-col h-[93%]">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-4">
            {conversations.map((message, index) => {
              if (index % 2 === 0) { // This is a user message
                const assistantMessage = conversations[index + 1]; // Get the next message (assistant's response)
                return (
                  <div key={message._id} className="space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                        <p>{message.content}</p>
                      </div>
                    </div>
                    
                    {/* AI response */}
                    {assistantMessage && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                          <p>{assistantMessage.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null; // Skip odd indices as they're handled with their corresponding even index
            })}
            <div ref={chatEndRef} /> {/* Scroll anchor */}
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={submitQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;