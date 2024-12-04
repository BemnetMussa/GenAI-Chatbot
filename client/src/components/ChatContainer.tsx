import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface MessageObject {
  _id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatContainerProps {
  chatHistory: MessageObject[];
  messageId: string | null;
  userName: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ chatHistory, messageId, userName }) => {
  const { id: userId } = useParams();
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState<MessageObject[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayedContent, setDisplayedContent] = useState<{ [key: string]: string }>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [welcome, setWelcome] = useState(false);
  
  const TYPING_SPEED = 100;

  useEffect(() => {
    setConversations(chatHistory);
  }, [chatHistory]);

  // Typing animation effect
  useEffect(() => {
    conversations.forEach((message) => {
      if (message.sender === 'assistant' && !displayedContent[message._id]) {
        let currentText = '';
        const content = message.content;
        let charIndex = 0;

        const typeText = () => {
          if (charIndex < content.length) {
            currentText += content[charIndex];
            setDisplayedContent(prev => ({
              ...prev,
              [message._id]: currentText
            }));
            charIndex++;
            setTimeout(typeText, 1000 / TYPING_SPEED);
          }
        };

        typeText();
      }
    });
  }, [conversations]);

  // Enhanced formatting function
  const renderFormattedContent = (text: string) => {
    const segments = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return segments.map((segment, index) => {
      if (segment.startsWith('***') && segment.endsWith('***')) {
        return (
          <span key={index} className="font-bold italic">
            {segment.slice(3, -3)}
          </span>
        );
      }
      
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return (
          <span key={index} className="font-bold">
            {segment.slice(2, -2)}
          </span>
        );
      }
      
      if (segment.startsWith('*') && segment.endsWith('*')) {
        return (
          <span key={index} className="italic">
            {segment.slice(1, -1)}
          </span>
        );
      }
      
      if (segment.startsWith('`') && segment.endsWith('`')) {
        return (
          <code key={index} className="bg-gray-100 px-1 rounded font-mono">
            {segment.slice(1, -1)}
          </code>
        );
      }

      if (segment.trim()) {
        const lines = segment.split('\n');
        return lines.map((line, lineIndex) => {
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <li key={`${index}-${lineIndex}`} className="ml-4 list-disc">
                {line.slice(2)}
              </li>
            );
          }
          
          if (line.match(/^\d+\./)) {
            return (
              <li key={`${index}-${lineIndex}`} className="ml-4 list-decimal">
                {line.replace(/^\d+\./, '').trim()}
              </li>
            );
          }
          
          return line.trim() && (
            <p key={`${index}-${lineIndex}`} className="mb-2">
              {line}
            </p>
          );
        });
      }

      return null;
    });
  };

  async function submitQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim()) return;

    setWelcome(true);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userId, messageId }),
      });

      if (!response.ok) {
        setError('Error occurred. Try again later');
        setLoading(false);
        return;
      }
      console.log(question, userId, messageId)
      const data = await response.json();

      const newUserMessage: MessageObject = {
        _id: Date.now().toString(),
        content: question,
        sender: 'user',
        timestamp: new Date(),
      };

      const newAIMessage: MessageObject = {
        _id: (Date.now() + 1).toString(),
        content: data.aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
        isTyping: true,
      };

      setConversations(prev => [...prev, newUserMessage, newAIMessage]);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error while fetching');
    } finally {
      setLoading(false);
    }

    setQuestion('');
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, displayedContent]);

  return (
    <div className="flex flex-col w-[100%] h-full">
      {!welcome ? (
        <div className="h-full flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-700">
            Hi {userName}, how can I help you today?
          </h1>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden max-h-[calc(100vh-138px)]">
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              {conversations.map((message) => (
                <div key={message._id} className="space-y-2">
                  {/* user request */}
                  {message.sender === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                        <p>{message.content}</p>
                      </div>
                    </div>
                  )}

                  {/* assistance response */}
                  {message.sender === 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%] prose">
                        {renderFormattedContent(displayedContent[message._id] || '')}
                        {!displayedContent[message._id] && (
                          <span className="inline-block w-2 h-4 bg-gray-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
              {error && <p className="text-red-500">{error}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="border-t bg-white p-4 justify-end">
        <form onSubmit={submitQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
        {loading && (
          <div className="mt-4 text-center text-gray-500">
            Please wait while we process your request...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;