import React, { useState, FormEvent, useEffect, useRef } from 'react';

interface Message {
  request: string;
  response: string;
}

interface Props {

}

const ChatContainer = (props: Props) => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState<Message[]>([
    { request: "hi", response: "hey there" }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  function submitQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim()) return;

    // Add new message to conversations
    const newMessage = {
      request: question,
      response: "AI responded your message" // response with actual AI response
    };

    setConversations([...conversations, newMessage]);
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
            {conversations.map((conversation, index) => (
              <div key={index} className="space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                    <p>{conversation.request}</p>
                  </div>
                </div>
             
                
                {/* AI response */}
                 <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                    <p>{conversation.response}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} /> {/* Scroll anchor */}
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