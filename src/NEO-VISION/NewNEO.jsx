import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  Code,
  Monitor,
  ChartNoAxesCombined,
  Square,
  Maximize2,
  Minimize2,
  Loader,
} from "lucide-react";
import { getPrewrittenConversations } from "./GetPrewrittenConversations";
import "./NewNEO.css";
import AudioPlayer from "./AudioPlayer";
import { Toaster, toast } from 'react-hot-toast';
import Markdown from 'react-markdown'
import TerminalCustome from "../artifact/TerminalCustome";
import FileBrowserCodeViewer from "../artifact/FileBrowserCodeViewer";
import ArtifactViewer from '../artifact/ArtifactViewer';
import { v4 as uuidv4 } from 'uuid';



const customToastStyle = {
  style: {
    background: '#181729',
    color: '#fff',
    border: '1px solid #4334E6',
    padding: '16px',
    borderRadius: '8px',
  },
  iconTheme: {
    primary: '#4334E6',
    secondary: '#fff',
  },
};

const ChatMessage = ({ content, isUser, onActionClick, isAudio, activeTab }) => {
  console.log("is audio", isAudio)
  console.log("content isUser onActionClick", content, isUser, onActionClick)
  const renderActions = (actions) => {
    return (
      <div className="mt-4 flex flex-col items-center w-full">
        <div
          className="text-purple-300 px-4 py-2 rounded-full inline-block mb-2 w-full mt-2 text-center"
          style={{
            background:
              "linear-gradient(90.04deg, #412F9F 0.03%, rgba(24, 23, 41, 0) 90.72%)",
          }}
        >
          <span className="mr-2 text-xl text-center">✦</span>
          You can take the following actions, click to test
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {actions.map((action, index) => {
            const actionText = action.replace(/^\[action\]|\[\/action\]$/g, "");
            return (
              <button
                key={index}
                onClick={() => onActionClick(actionText)}
                className="text-purple-300 px-4 py-2 rounded-md transition-colors"
                style={{
                  background: "#4334E630",
                  border: "0.4px solid #FFFFFF1A",
                  boxShadow: "0px 4px 12px 0px #00000014",
                }}
              >
                {actionText}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (typeof content === "string") {
      const parts = content.split(/(\[action\].*?\[\/action\])/g);
      const message = parts[0].trim();
      const actions = parts
        .slice(1)
        .filter((part) => part.startsWith("[action]"));
      if(!actions || actions.length === 0 ){
        console.log("here markdown")
        return <Markdown>{content}</Markdown>;
      }
      return (
        <>
          <p className="mb-2">{message}</p>
          {actions.length > 0 && renderActions(actions)}
        </>
      );
    } else if (content.role === "user" && content.name === "Executor") {
      // Handle Executor output
      return (
        <ArtifactViewer content={content.content} />
      );
    }
    // ... handle other content types if needed ...
  };

  return (
    <div className={`mb-4 ${isUser ? "text-right" : "text-left"}`}>
      <div
        className={`inline-block p-4 rounded-lg ${
          isUser ? "bg-[#2d2d44]" : "bg-[#2d2d44]"
        } max-w-[80%]`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

const SoundWave = () => (
  <div className="flex items-center space-x-1 mx-2">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-1 bg-white rounded-full animate-sound-wave"
        style={{
          height: `${6 + i * 3}px`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

const ThinkingIndicator = () => (
  <div className="inline-block p-4 bg-transparent rounded-lg ">
    <img
      src="/images/neo-vision/loader.gif"
      alt="Thinking..."
      className="w-full h-full" // Adjust size as needed
    />
  </div>
);

export const showCustomToast = (message, type = 'success', duration) => {
 switch (type) {
   case 'success':
     toast.success(message, customToastStyle, {
      duration: duration
     });
     break;
   case 'error':
     toast.error(message, customToastStyle);
     break;
   default:
     toast(message, customToastStyle);
 }
};
const NewNEO = () => {




  const [activeTab, setActiveTab] = useState("Browse");
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [tabContent, setTabContent] = useState(null);
  const chatEndRef = useRef(null);
  const [chatWidth, setChatWidth] = useState(100);
  const resizeRef = useRef(null);
  const [prewrittenConversation, setPrewrittenConversation] = useState([]);
  const [isTypingComplete, setIsTypingComplete] = useState(true);
  const inputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isVSCodeFullScreen, setIsVSCodeFullScreen] = useState(false);
  const [isVSCodeActive, setIsVSCodeActive] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [lastEventIndex, setLastEventIndex] = useState(-1);
  const [isUserInputRequired, setIsUserInputRequired] = useState(true);

  useEffect(() => {
    setPrewrittenConversation(
      getPrewrittenConversations(setActiveTab, setTabContent)
    );
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const chatContainer = chatEndRef.current.parentElement;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  useEffect(() => {
    if (isTypingComplete && !isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTypingComplete, isTyping]);

  const formatTextWithLineBreaks = (text) => {
    return text.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const simulateTyping = async (text, callback) => {
    console.log("Starting to type:", text);
    setIsTyping(true);
    setIsTypingComplete(false);
    setChatHistory((prev) => [...prev, { content: "", isUser: false }]);

    for (let i = 0; i <= text.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1)); // 50ms delay between characters
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].content = text.substring(0, i);
        return newHistory;
      });
    }

    console.log("Finished typing");
    setIsTyping(false);
    setIsTypingComplete(true);
    if (callback) setTimeout(callback, 500);
  };

  // Add this to your existing useEffect or create a new one
  useEffect(() => {
    let isMounted = true;
    const pollEvents = async () => {
      if (threadId && isMounted) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${threadId}`);
          if (response.ok) {
            const events = await response.json();
            if (isMounted) {
              updateChatHistory(events);
              await checkUserInputRequired();
              // Schedule the next poll after processing this response
              setTimeout(pollEvents, 1000);
            }
          }
        } catch (error) {
          console.error("Error polling events:", error);
          // If there's an error, wait before trying again
          if (isMounted) {
            setTimeout(pollEvents, 5000);
          }
        }
      }
    };

    if (threadId) {
      pollEvents();
    }

    return () => {
      isMounted = false;
    };
  }, [threadId]);

  const updateChatHistory = (events) => {
    // Filter out events we've already processed
    const newEvents = events.slice(lastEventIndex + 1);
    if (newEvents.length > 0) {
      setChatHistory(events); // Set the entire events array as the chat history
      setLastEventIndex(events.length - 1);
    }
  };

  const initChat = async (message) => {
    const newThreadId = uuidv4();
    setThreadId(newThreadId);
    setIsThinking(true);
    setLastEventIndex(-1); // Reset lastEventIndex when starting a new chat

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/init-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: newThreadId,
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      // The response is handled by the polling mechanism
    } catch (error) {
      console.error("Error initializing chat:", error);
      showCustomToast("Failed to start the conversation", "error");
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const userMessage = inputValue;
    setInputValue("");
    // Don't add user message to chat history here
    // It will be added when received from the server

    if (!threadId) {
      await initChat(userMessage);
    } else {
      await sendUserInput(userMessage);
    }
  };

  const sendUserInput = async (input) => {
    if (!threadId) {
      console.error("No active thread");
      return;
    }

    setIsThinking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-user-input/${threadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to send user input');
      }

      // The response is handled by the polling mechanism
    } catch (error) {
      console.error("Error sending user input:", error);
      showCustomToast("Failed to send your message", "error");
    } finally {
      setIsThinking(false);
    }
  };

  const checkUserInputRequired = async () => {
    if (!threadId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-input-required/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        
        setIsUserInputRequired(data?.user_input_required);
      }
    } catch (error) {
      console.error("Error checking user input requirement:", error);
    }
  };

  const terminateThread = async () => {
    if (!threadId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/terminate/${threadId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setThreadId(null);
        setChatHistory([]);
        showCustomToast("Conversation ended", "success");
      } else {
        throw new Error('Failed to terminate thread');
      }
    } catch (error) {
      console.error("Error terminating thread:", error);
      showCustomToast("Failed to end the conversation", "error");
    }
  };

  const handleResize = (e) => {
    if (resizeRef.current) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      setChatWidth(Math.max(30, Math.min(70, newWidth))); // Limit width between 30% and 70%
    }
  };

  const startResize = () => {
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  const stopResize = () => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        sendAudioMessage(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = (url) => {
    const newAudioMessage = { content: url, isUser: true, isAudio: true };
    console.log("new Audio Message", newAudioMessage)
    // setChatHistory((prev) => [...prev, newAudioMessage]);
    setChatHistory((prev) => [
      ...prev,
      {
        content: (
          <AudioPlayer
            audioSrc={"/images/neo-vision/audio.mp3"}
            onEnded={() => {
              simulateTyping("Here is the audio response...");
            }}
          />
        ),
        isUser: true,
        isAudio: true,
      },
    ]);

    simulateTyping("Processing Audio. Please hold tight...", () => {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        setChatHistory((prev) => [
          ...prev,
          {
            content: (
              <AudioPlayer
                audioSrc={"/images/neo-vision/audio.mp3"}
                onEnded={() => {
                  simulateTyping("Here is the audio response...");
                }}
              />
            ),
            isUser: false,
            isAudio: true,
          },
        ]);
      }, 3000); // 3 seconds delay to show the thinking indicator
    });
  };


const handleActionClick = async (actionText) => {
  setChatHistory((prev) => [...prev, { content: actionText, isUser: true }]);

  const currentConversation = prewrittenConversation.find(
    (conv) => conv.input.toLowerCase() === actionText.toLowerCase()
  );

  if (currentConversation) {
    // Output
    if (currentConversation.outputDelay) {
      setIsThinking(true);
      await new Promise((resolve) =>
        setTimeout(resolve, currentConversation.outputDelay)
      );
      setIsThinking(false);
    }
    await simulateTyping(currentConversation.output);

    // Action
    if (currentConversation.action) {
      if (currentConversation.actionDelay) {
        setIsThinking(true);
        await new Promise((resolve) =>
          setTimeout(resolve, currentConversation.actionDelay)
        );
        setIsThinking(false);
      }
      await new Promise((resolve) => currentConversation.action(resolve));
    }

    // FollowUp
    if (currentConversation.followUp) {
      if (currentConversation.followUpDelay) {
        setIsThinking(true);
        await new Promise((resolve) =>
          setTimeout(resolve, currentConversation.followUpDelay)
        );
        setIsThinking(false);
      }
      await simulateTyping(currentConversation.followUp);
    }
  } else {
    setIsThinking(true);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Default delay
    setIsThinking(false);
    await simulateTyping(
      "I'm sorry, I don't have a pre-written response for that action."
    );
  }
};

const handleTabClick = (tabName) => {
  setActiveTab(tabName);
  setIsVSCodeActive(tabName === "File Explorer");
};

const toggleVSCodeFullScreen = () => {
  setIsVSCodeFullScreen(!isVSCodeFullScreen);
};

useEffect(() => {
  const handleEscapeKey = (event) => {
    if (event.key === "Escape" && isVSCodeFullScreen) {
      setIsVSCodeFullScreen(false);
    }
  };

  document.addEventListener("keydown", handleEscapeKey);

  return () => {
    document.removeEventListener("keydown", handleEscapeKey);
  };
}, [isVSCodeFullScreen]);

const handleIframeLoad = () => {
  setIsIframeLoaded(true);
};

  return (
    <div className="flex flex-col h-screen bg-[#14141f] text-white overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: customToastStyle.style,
        }}
      />
      <nav className="bg-[#1A162F] p-1 flex items-center justify-between">
        <div className="flex items-center ms-4">
          <img
            src="/images/neo-vision/monster-logo.png"
            alt="Neo Logo"
            className="w-12 h-12"
          />
          <span className="font-semibold uppercase">Neo</span>
        </div>
        {isVSCodeActive && (
          <div className="artifact-section flex justify-center items-center">
            {[
              { name: "Artifact Viewer", icon: Code },
              { name: "Monitor", icon: ChartNoAxesCombined },
              { name: "File Explorer", icon: Monitor },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`px-4 py-2 border-none flex items-center justify-center space-x-1 ${
                  activeTab === name
                    ? "bg-[#2d2d44] shadow-xl rounded-xl"
                    : "bg-transparent"
                }`}
                onClick={() => handleTabClick(name)}
              >
                <Icon size={16} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex space-x-2">
          <img src="/images/neo-vision/btn-navbar.svg" alt="Neo Logo" />
        </div>
      </nav>
      <div className="flex flex-1 bg-[#0C0A1F] p-4 overflow-hidden">
        <div
          className="flex flex-col bg-[#181729] rounded-xl custom-scrollbar"
          style={{ width: `${chatWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-6 ">
            {chatHistory.map((message, index) => (
              <ChatMessage
                key={index}
                content={message.content}
                isUser={message.role === "user" && message.name === "Admin"}
                isAudio={message?.isAudio}
                onActionClick={handleActionClick}
                activeTab={activeTab}
              />
            ))}
            {threadId && !isUserInputRequired && <ThinkingIndicator />}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center bg-[#2D2D44] rounded-full py-1 overflow-hidden">
              {console.log("isUserInputRequired",(isUserInputRequired))}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isUserInputRequired ? "Write prompt" : "Waiting for response..."}
                className="flex-1 bg-transparent border-none text-white py-3 px-6 mx-2 focus:outline-none rounded-xl"
                disabled={isUserInputRequired === true ? false : true}
                ref={inputRef}
              />
              <button
                type="submit"
                className="bg-[#4A4A6A] rounded-full border-none p-3 mr-1"
                disabled={isUserInputRequired === true ? false : true}
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </form>
        </div>

        <div
          ref={resizeRef}
          className="w-4 cursor-col-resize select-none"
          onMouseDown={startResize}
        ></div>

        <div
          className={`rounded-md overflow-hidden ${
            isVSCodeFullScreen ? "fixed inset-0 z-50" : ""
          }`}
          style={{ width: isVSCodeFullScreen ? "100%" : `${100 - chatWidth}%` }}
        >
          {!isVSCodeActive && (
            <div className="artifact-section flex justify-center items-center p-1 bg-[#181729] rounded-xl">
              {[
                { name: "Artifact Viewer", icon: Code },
                { name: "Monitor", icon: ChartNoAxesCombined },
                { name: "File Explorer", icon: Monitor },
              ].map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`px-6 py-4 w-full border-none flex items-center justify-center space-x-1 ${
                    activeTab === name
                      ? "bg-[#2d2d44] shadow-xl rounded-xl"
                      : "bg-[#181729]"
                  }`}
                  onClick={() => handleTabClick(name)}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}

          <div className={`bg-[#141324] ${activeTab === "File Explorer" ? "h-full" : "mt-4 h-[calc(100%-4rem)]"} overflow-auto rounded-xl relative`}>
            {activeTab === "Artifact Viewer" && tabContent}
            {activeTab === "File Explorer" && (
              <>
                <button
                  className="absolute bottom-2 right-2 z-10 bg-[#2d2d44] p-2 rounded-full"
                  onClick={toggleVSCodeFullScreen}
                >
                  {isVSCodeFullScreen ? (
                    <Minimize2 size={20} />
                  ) : (
                    <Maximize2 size={20} />
                  )}
                </button>
                {!isIframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#141324]">
                    <Loader size={40} className="animate-spin text-purple-500" />
                  </div>
                )}
                <iframe
                  src="https://8080-i0mimhhk17j5q5grbwlpo-b0b684e9.e2b.dev/?folder=/home/user"
                  title="File Explorer"
                  className="w-full h-full border-none"
                  onLoad={handleIframeLoad}
                  style={{ display: isIframeLoaded ? 'block' : 'none' }}
                />
              </>
            )}
            {activeTab === "Monitor" && tabContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewNEO;
