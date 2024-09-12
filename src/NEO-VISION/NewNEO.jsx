import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  Code,
  Monitor,
  ChartNoAxesCombined,
  Square,
} from "lucide-react";
import { getPrewrittenConversations } from "./GetPrewrittenConversations";
import "./NewNEO.css";
import AudioPlayer from "./AudioPlayer";
import { Toaster } from "react-hot-toast";

const formatTextWithClickableElements = (text, onActionClick) => {
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\[action\].*?\[\/action\]|\bhttps?:\/\/\S+)/gi);

    const formattedLine = parts.map((part, partIndex) => {
      if (part.startsWith("[action]") && part.endsWith("[/action]")) {
        const action = part.slice(8, -9); // Remove [action] and [/action] tags
        return (
          <span
            key={`${lineIndex}-${partIndex}`}
            className="cursor-pointer text-green-500 hover:underline"
            onClick={() => onActionClick(action)}
          >
            {action}
          </span>
        );
      } else if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={`${lineIndex}-${partIndex}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {part}
          </a>
        );
      } else {
        return part;
      }
    });

    return (
      <React.Fragment key={lineIndex}>
        {formattedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const ChatMessage = ({ content, isUser, onActionClick }) => {
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

      return (
        <>
          <p className="mb-2">{message}</p>
          {actions.length > 0 && renderActions(actions)}
        </>
      );
    }
    return <p>{content}</p>;
  };

  return (
    <div className={`mb-4 ${isUser ? "text-right" : "text-left"}`}>
      <div
        className={`inline-block p-4 rounded-lg ${
          isUser ? "bg-[#2d2d44]" : "bg-[#181729]"
        } max-w-[80%]`}
      >
        {content ? renderContent() : null}
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

const NewNEO = () => {
  const [activeTab, setActiveTab] = useState("Browse");
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [tabContent, setTabContent] = useState(null);
  const chatEndRef = useRef(null);
  const [chatWidth, setChatWidth] = useState(60);
  const resizeRef = useRef(null);
  const [prewrittenConversation, setPrewrittenConversation] = useState([]);
  const [isTypingComplete, setIsTypingComplete] = useState(true);
  const inputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isThinking, setIsThinking] = useState(false);

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
      await new Promise((resolve) => setTimeout(resolve, 5)); // 5ms delay between characters
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "" || isTyping) return;

    console.log("User input:", inputValue);
    setChatHistory((prev) => [...prev, { content: inputValue, isUser: true }]);
    setInputValue("");

    const currentConversation = prewrittenConversation.find(
      (conv) => conv.input.toLowerCase() === inputValue.toLowerCase()
    );

    console.log("Matched conversation:", currentConversation);

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
      console.log("No matching conversation found");
      setIsThinking(true);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Default delay
      setIsThinking(false);
      await simulateTyping(
        "I'm sorry, I don't have a pre-written response for that input."
      );
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
    setChatHistory((prev) => [...prev, newAudioMessage]);

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

  return (
    <div className="flex flex-col h-screen bg-[#14141f] text-white overflow-hidden">
      <Toaster />
      <nav className="bg-[#1A162F] p-1 flex items-center justify-between">
        <div className="flex items-center ms-4">
          <img
            src="/images/neo-vision/monster-logo.png"
            alt="Neo Logo"
            className="w-12 h-12"
          />
          <span className="font-semibold uppercase">Neo</span>
        </div>
        <div className="flex space-x-2">
          <img src="/images/neo-vision/btn-navbar.svg" alt="Neo Logo" />
          {/* <button className="p-2 rounded-lg bg-[#2d2d44]">
            <Layers size={16} />
          </button>
          <button className="p-2 rounded-lg bg-[#2d2d44]">
            <Grid size={16} />
          </button>
          <button className="p-2 rounded-lg bg-[#2d2d44]">
            <Sun size={16} />
          </button> */}
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
                isUser={message.isUser}
                onActionClick={handleActionClick}
              />
            ))}
            {isThinking && <ThinkingIndicator />}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center bg-[#2D2D44] rounded-full py-1  overflow-hidden">
              <button
                type="button"
                className="bg-[#4A4A6A] rounded-full border-none p-3 ml-1"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square size={20} className="text-white" />
                ) : (
                  <Mic size={20} className="text-white" />
                )}
              </button>
              {isRecording && <SoundWave />}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "Recording..." : "Write prompt"}
                className="flex-1 bg-transparent border-none text-white py-3 px-6 mx-2 focus:outline-none rounded-xl"
                disabled={isTyping || isRecording}
                ref={inputRef}
              />
              <button
                type="submit"
                className="bg-[#4A4A6A] rounded-full border-none p-3 mr-1"
                disabled={isTyping || isRecording}
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </form>
        </div>

        <div
          ref={resizeRef}
          className="w-4  cursor-col-resize select-none"
          onMouseDown={startResize}
        ></div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ width: `${100 - chatWidth}%` }}
        >
          <div className="flex  justify-center items-center p-1 bg-[#181729] rounded-xl  ">
            {[
              { name: "Code", icon: Code },
              { name: "Monitor", icon: ChartNoAxesCombined },
              { name: "Browse", icon: Monitor },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`px-6 py-4 w-full border-none flex items-center justify-center space-x-1 ${
                  activeTab === name
                    ? "bg-[#2d2d44] shadow-xl rounded-xl"
                    : "bg-[#181729]"
                }`}
                onClick={() => setActiveTab(name)}
              >
                <Icon size={16} />
                <span>{name}</span>
              </button>
            ))}
          </div>

          <div
            className="
          bg-[141324]
           mt-4  p-6 h-[calc(100%-4rem)] overflow-auto rounded-xl"
          >
            {tabContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewNEO;
