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
  ChevronLeft,
  ChevronRight,
  RefreshCw, // Add this import for the reload icon
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
import MLTaskForm from "./MLTaskForm";
import { Tooltip } from 'react-tooltip'; // Add this import at the top
import  Terminal  from 'react-terminal-ui';
import { useInterval } from 'react-use';
import Modal from 'react-modal'; // Make sure to install this package

const customToastStyle = {
  style: {
    background: '#1e1e1e', // Updated to VS Code dark background
    color: '#cccccc', // Updated to VS Code text color
    border: '1px solid #007acc', // Updated to VS Code blue
    padding: '16px',
    borderRadius: '8px',
  },
  iconTheme: {
    primary: '#007acc', // Updated to VS Code blue
    secondary: '#cccccc', // Updated to VS Code text color
  },
};

const ChatMessage = ({ content, name, isUser, onActionClick, isAudio, activeTab, onViewCode }) => {
  const renderContent = () => {
    if (typeof content === "string") {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
          parts.push(
            <Markdown key={lastIndex}>
              {content.slice(lastIndex, match.index)}
            </Markdown>
          );
        }

        // Add "View Code" button instead of code block
        const language = match[1] || 'plaintext';
        const code = match[2].trim();
        parts.push(
          <button
            key={match.index}
            onClick={() => onViewCode(code, language)}
            className="bg-[#4A4A6A] text-white px-3 py-1 rounded-md mt-2 mb-2"
          >
            View Code
          </button>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after last code block
      if (lastIndex < content.length) {
        parts.push(
          <Markdown key={lastIndex}>
            {content.slice(lastIndex)}
          </Markdown>
        );
      }

      return parts;
    } else if (content.role === "user" && content.name === "Executor") {
      // Handle Executor output
      return (
        <ArtifactViewer 
          content={content.content} 
          type="code" 
          language="plaintext"
        />
      );
    }
    // ... handle other content types if needed ...
  };

  return (
    <div className={`mb-4 ${isUser ? "text-right" : "text-left"}`}>
      <div
        className={`inline-block p-4 rounded-lg break-words	 ${
          isUser ? "bg-[#2d2d2d]" : "bg-[#2d2d2d]" // Updated to VS Code darker gray
        } max-w-[80%]`}
      >
        {name !== "Admin" && (
          <div className="inline-block bg-[#007acc] text-[#cccccc] text-sm font-semibold py-1 px-3 rounded-full shadow-md mb-2">
            @{name}
          </div>
        )}
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
      className="w-full h-full"
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
  const [activeTab, setActiveTab] = useState("Artifact Viewer");
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [tabContent, setTabContent] = useState(null);
  const chatEndRef = useRef(null);
  const [chatWidth, setChatWidth] = useState(40);
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
  const [threadId, setThreadId] = useState(() => localStorage.getItem('threadId') || null);
  const [lastEventIndex, setLastEventIndex] = useState(-1);
  let [isUserInputRequired, setIsUserInputRequired] = useState(false);
  const [artifactContent, setArtifactContent] = useState(null);
  let [firstTimeQuery, setFirstTimeQuery] = useState(true);
  const [isArtifactVisible, setIsArtifactVisible] = useState(true);
  const [terminalLines, setTerminalLines] = useState([]);
  const terminalRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const welcomeMessage = {
    content: {
      text: `Greetings, human!\nI’m Neo, your personal ML engineer. 🚀

Here's what I can do:\n\n`,
      tasks: [
        {
          display: "Train a model for movie recommendations.",
          detailed: "Train a model for movie recommendations."
        },
        {
          display: "Build a dog breed classification model.",
          detailed: `Given a dataset of images of dogs, predict the breed of each image.

# Metric

Multi Class Log Loss.

# Submission Format

For each image in the test set, you must predict a probability for each of the different breeds. The file should contain a header and have the following format:
\`\`\`
id,affenpinscher,afghan_hound,..,yorkshire_terrier
000621fb3cbb32d8935728e48679680e,0.0083,0.0,...,0.0083
etc.
\`\`\`

# Dataset Description

- \`train.zip\` - the training set, you are provided the breed for these dogs
- \`test.zip\` - the test set, you must predict the probability of each breed for each image
- \`sample_submission.csv\` - a sample submission file in the correct format
- \`labels.csv\` - the breeds for the images in the train set

# Dataset name:
dog-breed-identification

Dataset can be downloaded using Kaggle CLI:
\`\`\`bash
kaggle competitions download -c dog-breed-identification
\`\`\`

Assume that the Kaggle CLI is already installed and ready to use.`
        },
        {
          display: "Set up a chat moderation pipeline using GPT-4o.",
          detailed: "Set up a chat moderation pipeline using GPT-4o."
        }
      ],
      footer: `I'm always learning, so I might run into a few errors (don't worry, I'll fix them!). If needed, I may ask for your guidance as well.

Give me a task, and I'll dive right in!`
    },
    isUser: false,
    name: "Neo"
  };
  useEffect(() => {
    // Display welcome message when component mounts
    setChatHistory([welcomeMessage]);
  }, []);

  const handleCapabilityClick = (capability) => {
    console.log("capability", capability)
    const task = welcomeMessage.content.tasks.find(t => t.display === capability);
    setInputValue(task ? task.detailed : capability);
  };

  const renderMessageContent = (content) => {
    if (typeof content === 'string') {
      return <div>{content}</div>;
    }

    return (
      <>
        <div>{content.text} <br /> <br /></div>
        {content.tasks.map((task, index) => (
          <div 
            key={index} 
            className="ml-4  cursor-pointer text-blue-400 hover:underline" 
            onClick={() => handleCapabilityClick(task.display)}
          >
            • {task.display} <br /> <br />
          </div>
        ))}
        <div>{content.footer}</div>
      </>
    );
  };


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

  useEffect(() => {
    let isMounted = true;
    const pollEvents = async () => 
      {
        
      if (threadId && isMounted) {
        try {
          const response = await fetch(`https://neov1.monsterapi.ai/backend/events/${threadId}`);
          if (response.ok) {
            const events = await response.json();
            console.log("events", events)
            if (isMounted) {
              updateChatHistory(events?.events);
           
              // else if (firstTimeQuery === false){
              //   setFirstTimeQuery(false);
              //   await checkUserInputRequired();
              //   setTimeout(pollEvents, 1000);
              // }
            //  else{
            //   await checkUserInputRequired();
            //   setFirstTimeQuery(false);
            //   setTimeout(pollEvents, 1000);
            //  }
            }
          }
        } catch (error) {
          console.error("Error polling events:", error);
          if (isMounted) {
            setTimeout(pollEvents, 5000);
          }
        }
      }
    };

    const pollUserInputRequired = async () => {
      await checkUserInputRequired();
      if (isUserInputRequired === false) {
        setTimeout(pollUserInputRequired, 1000);
      }
    }

    // if(isUserInputRequired === false && firstTimeQuery === true){
    //   setFirstTimeQuery(false);
    //   firstTimeQuery = false;
    //   await checkUserInputRequired();
    //   console.log("isUserInputRequired",isUserInputRequired, "firstTimeQuery", firstTimeQuery)
    //   setTimeout(pollEvents, 1000);
    // }
    // else if(isUserInputRequired === true){
    //   // setFirstTimeQuery(false);
    //   return;
    // }
    // else{
    //   await checkUserInputRequired();
    // }
    

    if (threadId && (isUserInputRequired === false || firstTimeQuery === true)) {
      console.log("threadId", threadId, "isUserInputRequired", isUserInputRequired, "firstTimeQuery", firstTimeQuery)
      pollEvents();
      pollUserInputRequired();
    }
    if (threadId && isUserInputRequired === false) {
      pollEvents();
      pollUserInputRequired();
    } 

    return () => {
      isMounted = false;
    };
  }, [threadId, isUserInputRequired]);

  const updateChatHistory = (events) => {
    const newEvents = events.slice(lastEventIndex + 1);
    if (newEvents.length > 0) {
      setChatHistory(events.map(event => ({
        ...event,
        content: event.content,
        isUser: event.role === "user" && event.name === "Admin"
      })));
      setLastEventIndex(events.length - 1);
    }
  };

  const initChat = async (message) => {
    const newThreadId = uuidv4();
    setThreadId(newThreadId);
    localStorage.setItem('threadId', newThreadId);
    setIsThinking(true);
    setLastEventIndex(-1);

    try {
      const response = await fetch(`https://neov1.monsterapi.ai/backend/init-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: newThreadId,
          message: message,
          token: localStorage.getItem('auth_token')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const userMessage = inputValue;
    setInputValue("");

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
      const response = await fetch(`https://neov1.monsterapi.ai/backend/send-user-input/${threadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to send user input');
      }
      setIsUserInputRequired(false);
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
      const response = await fetch(`https://neov1.monsterapi.ai/backend/user-input-required/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setIsUserInputRequired(data?.user_input_required);
        isUserInputRequired = data?.user_input_required;
      }
    } catch (error) {
      console.error("Error checking user input requirement:", error);
    }
  };

  const handleStop = async () => {
    await terminateThread();
    localStorage.removeItem('threadId');
    setThreadId(null);
    setChatHistory([]);
  };

  const terminateThread = async () => {
    if (!threadId) return;

    try {
      const response = await fetch(`https://neov1.monsterapi.ai/backend/terminate/${threadId}`, {
        method: 'POST',
      });

      if (response.ok) {
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
      setChatWidth(Math.max(30, Math.min(70, newWidth)));
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

  const handleViewCode = (code, language) => {
    setArtifactContent({ content: code, type: "code", language });
    setActiveTab("Artifact Viewer");
  };

  const handleActionClick = async (actionText) => {
    setChatHistory((prev) => [...prev, { content: actionText, isUser: true }]);

    const currentConversation = prewrittenConversation.find(
      (conv) => conv.input.toLowerCase() === actionText.toLowerCase()
    );

    if (currentConversation) {
      if (currentConversation.outputDelay) {
        setIsThinking(true);
        await new Promise((resolve) =>
          setTimeout(resolve, currentConversation.outputDelay)
        );
        setIsThinking(false);
      }
      await simulateTyping(currentConversation.output);

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
      await new Promise((resolve) => setTimeout(resolve, 1500));
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

  const toggleArtifactVisibility = () => {
    setIsArtifactVisible(!isArtifactVisible);
    if (isArtifactVisible) {
      setChatWidth(100);
    } else {
      setChatWidth(40);
    }
  };

  const fetchTerminalLogs = async () => {
    try {
      const response = await fetch('https://neov1.monsterapi.ai/backend/agent_terminal_logs');
      const data = await response.json();
      setTerminalLines(prevLines => {
        const newLines = data.last_lines.filter(line => !prevLines.includes(line));
        return [...prevLines, ...newLines];
      });
    } catch (error) {
      console.error('Error fetching terminal logs:', error);
    }
  };

  useInterval(() => {
    if (activeTab === 'Terminal') {
      fetchTerminalLogs();
    }
  }, 2000);

  useEffect(() => {
    if (isScrolledToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines, isScrolledToBottom]);

  const handleTerminalScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      setIsScrolledToBottom(scrollHeight - scrollTop === clientHeight);
    }
  };

  // useEffect(() => {
  //   const storedThreadId = localStorage.getItem('threadId');
  //   if (storedThreadId) {
  //     setIsModalOpen(true);
  //   }
  // }, []);

  const handleContinueSession = () => {
    const storedThreadId = localStorage.getItem('threadId');
    if (storedThreadId) {
      setThreadId(storedThreadId);
      fetchEventsAndUpdateChat(storedThreadId);
    }
    setIsModalOpen(false);
  };

  const handleNewSession = () => {
    localStorage.removeItem('threadId');
    window.location.reload();
    setThreadId(null);
    setIsModalOpen(false);
  };

  const handleReload = async () => {
    try {
      const response = await fetch(`https://neov1.monsterapi.ai/backend/terminate/${threadId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        localStorage.removeItem('threadId');
        window.location.reload();
      } else {
        throw new Error('Failed to terminate session');
      }
    } catch (error) {
      console.error("Error terminating session:", error);
      showCustomToast("Failed to reload. Please try again.", "error");
    }
  };

  useEffect(() => {
    const storedThreadId = localStorage.getItem('threadId');
    if (storedThreadId) {
      setThreadId(storedThreadId);
      fetchEventsAndUpdateChat(storedThreadId);
      
    }
  }, []);

  const fetchEventsAndUpdateChat = async (threadId) => {
    try {
      const response = await fetch(`https://neov1.monsterapi.ai/backend/events/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        updateChatHistory(data.events);
        setIsModalOpen(true);
      } else {
        const errorData = await response.json();
        if (errorData.detail === "Thread not found") {
          localStorage.removeItem('threadId');
          window.location.reload();
        } else {
          console.error('Failed to fetch events:', errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: customToastStyle.style,
        }}
      />
      <nav className="bg-[#252526] p-1 flex items-center justify-between">
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
              { name: "Terminal", icon: Square }, // Add this new tab
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
        <div className="flex space-x-2 me-4">
          <button
            onClick={handleReload}
            className="p-2 rounded-full bg-[#2D2D44] hover:bg-[#3D3D54] transition-colors duration-200"
            title="Reload"
            data-tooltip-id="reload-tooltip"
            data-tooltip-content="Terminate and reload the chat"
          >
            <RefreshCw size={20} />
            <Tooltip id="reload-tooltip" />
          </button>
        </div>
      </nav>
      <div className="flex flex-1 bg-[#1e1e1e] p-4 overflow-hidden">
        <div
          className="flex flex-col bg-[#252526] rounded-xl custom-scrollbar transition-all duration-300 ease-in-out"
          style={{ width: `${chatWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-6 ">
          {chatHistory.slice(0,1).map((message, index) => (
              <div key={index} className={`mb-4 ${message.isUser ? "text-right" : "text-left"}`}>
                <div className={`inline-block p-4 rounded-lg ${message.isUser ? "bg-[#2d2d44]" : "bg-[#2d2d44]"} max-w-[80%]`}>
                  {message.name !== "Admin" && (
                    <div className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold py-1 px-3 rounded-full shadow-md mb-2">
                      @{message.name}
                    </div>
                  )}
                  {renderMessageContent(message.content)}
                </div>
              </div>
            ))}
              {chatHistory.slice(1).map((message, index) => (
              <ChatMessage
                key={index}
                content={message.content}
                name={message.name}
                isUser={message.isUser}
                isAudio={message?.isAudio}
                onActionClick={handleActionClick}
                activeTab={activeTab}
                onViewCode={handleViewCode}
              />
            ))}
            {threadId && !isUserInputRequired && <ThinkingIndicator />}
            <div ref={chatEndRef} />
          </div>
          
          <MLTaskForm 
            onSubmit={handleSubmit} 
            onStop={handleStop}
            isUserInputRequired={isUserInputRequired} 
            firstTimeQuery={firstTimeQuery} 
            value={inputValue} 
            setInputValue={setInputValue}
          />
        </div>

        <div
          ref={resizeRef}
          className="w-4 cursor-col-resize select-none flex flex-col items-center justify-center"
          onMouseDown={startResize}
        >
          <button
            onClick={toggleArtifactVisibility}
            style={{zIndex:1}}
            className={`p-1 bg-[#2D2D44]  rounded-full ${isModalOpen ? "hidden" : ""} transition-transform duration-300 ease-in-out hover:bg-[#3D3D54]`}
          >
            {isArtifactVisible ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div
          className={`rounded-md overflow-hidden transition-all duration-300 ease-in-out ${
            isVSCodeFullScreen ? "fixed inset-0 z-50" : ""
          }`}
          style={{ 
            width: isVSCodeFullScreen ? "100%" : `${100 - chatWidth}%`,
            opacity: isArtifactVisible ? 1 : 0,
            visibility: isArtifactVisible ? 'visible' : 'hidden',
          }}
        >
          {!isVSCodeActive && (
            <div className="artifact-section flex justify-center items-center p-1 bg-[#252526] rounded-xl">
              {[
                { name: "Artifact Viewer", icon: Code },
                { name: "Terminal", icon: Square }, // Add this new tab
                { name: "Monitor", icon: ChartNoAxesCombined },
                { name: "File Explorer", icon: Monitor },
              ].map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`px-6 py-4 w-full border-none flex items-center justify-center space-x-1 ${
                    activeTab === name
                      ? "bg-[#37373d] shadow-xl rounded-xl"
                      : "bg-[#252526]"
                  }`}
                  onClick={() => handleTabClick(name)}
                  disabled={name === "Monitor" || name === "File Explorer"}
                  data-tooltip-id={name === "Monitor" || name === "File Explorer" ? "monitor-tooltip" : undefined}
                  data-tooltip-content={name === "Monitor" || name === "File Explorer" ? "Coming soon" : undefined}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                </button>
              ))}
              <Tooltip id="monitor-tooltip" />
            </div>
          )}

          <div className={`bg-[#1e1e1e] ${activeTab === "File Explorer" ? "h-full" : "mt-4 h-[calc(100%-4rem)]"} overflow-auto rounded-xl relative`}>
            {activeTab === "Artifact Viewer" && (
              <ArtifactViewer
                content={artifactContent?.content}
                type={artifactContent?.type}
                language={artifactContent?.language}
              />
            )}
            {activeTab === "File Explorer" && (
              <>
                <button
                  className="absolute bottom-2 right-2 z-10 bg-[#2d2d44] p-2 rounded-full"
                  onClick={toggleVSCodeFullScreen}
                  disabled={true}
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
            {activeTab === "Terminal" && (
              <div 
                ref={terminalRef}
                className="h-full overflow-auto"
                onScroll={handleTerminalScroll}
              >
                <Terminal
                  name="NEO Terminal"
                  prompt="neo>"
                  height="100%"
                  colorMode="dark"
                  commands={{
                    'clear': () => setTerminalLines([]),
                  }}
                >
                  {terminalLines.map((line, index) => (
                    <div className="text-sm" key={index}>{line}</div>
                  ))}
                </Terminal>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {}} // Empty function to prevent closing
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#252526',
            border: '1px solid #007acc',
            borderRadius: '8px',
            padding: '20px',
            color: '#cccccc',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }
        }}
        contentLabel="Session Modal"
      >
        <h2 className="text-xl mb-4">Existing Session Found</h2>
        <p className="mb-4">Do you want to continue the existing session or start a new one?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleContinueSession}
            className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005999]"
          >
            Continue Session
          </button>
          <button
            onClick={handleNewSession}
            className="px-4 py-2 bg-[#4A4A6A] text-white rounded hover:bg-[#3A3A5A]"
          >
            New Session
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default NewNEO;