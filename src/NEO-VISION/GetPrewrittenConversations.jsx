import React from "react";
// import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayer from "./AudioPlayer";
import { FaCopy } from "react-icons/fa6";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./NewNEO.css";
import { toast } from "react-hot-toast";
import { showCustomToast } from "./NewNEO";
import ArtifactViewer from '../artifact/ArtifactViewer';

// eslint-disable-next-line react/prop-types
const CodeTab = ({ code, language = "python", onComplete }) => {
  const [displayedCode, setDisplayedCode] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const codeContainerRef = React.useRef(null);

  React.useEffect(() => {
    setDisplayedCode("");
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < code.length) {
        setDisplayedCode((prev) => {
          const newCode = prev + code[i];
          // Scroll to bottom after each character is added
          setTimeout(() => {
            if (codeContainerRef.current) {
              codeContainerRef.current.scrollTop =
                codeContainerRef.current.scrollHeight;
            }
            // Also scroll the window to the bottom
            window.scrollTo(0, document.body.scrollHeight);
          }, 0);
          return newCode;
        });
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, 5);

    return () => clearInterval(typingInterval);
  }, [code, onComplete]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollbarStyles = `
    .code-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .code-scrollbar::-webkit-scrollbar-track {
      background: #1e1e2f;
      border-radius: 4px;
    }
    .code-scrollbar::-webkit-scrollbar-thumb {
      background: #4a4a6a;
      border-radius: 4px;
    }
    .code-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #5a5a7a;
    }
  `;

  return (
    <div className="relative bg-[#1e1e2f] rounded-lg overflow-hidden h-full flex flex-col">
      <style>{scrollbarStyles}</style>
      <div className="flex justify-between items-center px-4 py-2 bg-[#2d2d44]">
        <span className="text-gray-300 text-sm">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center bg-[#3d3d5c] text-gray-300 px-2 py-1 rounded text-sm transition-colors duration-200 hover:bg-[#4d4d7a]"
        >
          <FaCopy className="mr-1" />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div
        ref={codeContainerRef}
        className="flex-grow overflow-auto code-scrollbar"
      >
        <div className="p-4">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, background: "transparent" }}
          >
            {displayedCode}
          </SyntaxHighlighter>
          {isTyping && (
            <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

const MonitorTab = ({ images, imagesPerRow = 2 }) => {
  return (
    <div
      className={`grid gap-4 justify-center`}
      style={{
        gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))`,
      }}
    >
      <AnimatePresence>
        {images
          .filter((img) => img !== undefined && img !== null)
          .map((imagePath, index) => (
            <motion.div
              key={imagePath}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.5 }} // Add delay based on index
              className="w-full"
            >
              <img
                src={imagePath}
                alt={`Chart ${index + 1}`}
                className="w-full h-auto rounded-lg"
                onError={() =>
                  console.error(`Failed to load image: ${imagePath}`)
                }
              />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

const BrowseTab = ({ videoSrc, onVideoEnd }) => (
  <div className="relative pb-[56.25%] h-0">
    <video
      className="absolute top-0 left-0 w-full h-full"
      autoPlay
      muted
      onEnded={onVideoEnd}
      controls={false}
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
);

export const getPrewrittenConversations = (setActiveTab, setTabContent) => [
  {
    input:
      "Hey Neo! I need a voice agent that can handle 100K calls in Spanish.",
    output: `I see. I'd like to suggest a finetuning approach for this. Do you have a dataset or should I curate one from online resources?`,
    outputDelay: 2000, // 2 seconds delay before showing output
  },
  {
    input: `Yes, I have a s3 data bucket. Here it is: s3://stt-spanish-english-data/audio-train-00253.parquet`,
    output: `Your dataset has few samples. I'll augment it by adding more and diversifying to cover a wider range of use cases.`,
    outputDelay: 1500, // 1.5 seconds delay before showing output
    action: (onComplete) => {
      setActiveTab("Browse");
      setTabContent(
        <BrowseTab
          videoSrc="/images/neo-vision/hf.mov"
          onVideoEnd={onComplete}
        />
      );
    },
    actionDelay: 1000, // 1 second delay before starting action
    followUp: `I've increased the sample size, improved the quality of dataset, reformatted it and now we can proceed with the finetuning experiments.
      
      Let me know if you have any preferred hyperparameters or training configurations.
      `,
    followUpDelay: 2000, // 2 seconds delay before showing followUp
  },
  {
    input: "No, please proceed with your experimentation!",
    output: "On it please wait!",
    outputDelay: 1000, // 1 second delay before showing output
    action: (onComplete) => {
      setActiveTab("Monitor");
      const imagesToShow = [
        "/images/neo-vision/finetune-experiment/finetune1.svg",
        "/images/neo-vision/finetune-experiment/finetune2.svg",
        "/images/neo-vision/finetune-experiment/finetune3.svg",
        "/images/neo-vision/finetune-experiment/finetune4.svg",
        "/images/neo-vision/finetune-experiment/finetune5.svg",
      ];
      setTabContent(<MonitorTab images={imagesToShow} imagesPerRow={2} />);
      setTimeout(onComplete, 5000);
    },
    actionDelay: 4000, // 2 seconds delay before starting action
    followUp: `Found the best model. Should I deploy it?`,
    followUpDelay: 1500, // 1.5 seconds delay before showing followUp
  },
  {
    input: "Yes Deploy it",
    output: `For optimized inference I am considering below implementations and executing them:
  
  ## Serving engines:
  - CTranslate2
  - Huggingface
  - WhisperX
  - Huggingface FA2
  
  ## Compute type:
  - Float16
  - Float32
  
  ## Other considerations:
  - Different GPU types
  
  `,
    outputDelay: 2500,
    action: (onComplete) => {
      setActiveTab("Monitor");
      setTabContent(
        <MonitorTab
          images={[
            "/images/neo-vision/latency-chart/latency1.svg",
            "/images/neo-vision/latency-chart/latency2.svg",
          ]}
          imagesPerRow={1}
        />
      );
      setTimeout(onComplete, 1000);
    },
    actionDelay: 1500,
    followUp: `Here are the charts for latency distributions and cost analysis based on my experiments.
  
  **Decision:** I am going forward with using **A100 GPU servers** for deployment with **FP16 compute type**.
  
  I am considering the following conditions for auto-scaling pipeline:
  
  1. US timezone
  2. 100K sessions per day
  3. Peak concurrency at 50 requests
  
  Should I proceed?
  
  `,
    followUpDelay: 3000,
  },
  {
    input: "Yes, go ahead.",
    output: "Setting up the deployment on your AWS cloud account.",
    outputDelay: 1500, // 1.5 seconds delay before showing output
    action: (onComplete) => {
      setTimeout(() => {
        onComplete();
      }, 3000); // 3 seconds delay
    },
    actionDelay: 1000, // 1 second delay before starting action
    followUp: `Service is live at endpoint:
https://2a4e9fc5-eed1-429c-af91-cb2535517b34.monsterapi.ai/docs

You can take the following actions:
[action]Try deployment[/action]
[action]Monitor Performance[/action]
  `,
    followUpDelay: 2000, // 2 seconds delay before showing followUp
  },
  {
    input: "Try deployment",
    output: "Please give me an audio sample",
    outputDelay: 1000, // 1 second delay before showing output
  },
  {
    input: "Monitor Performance",
    output: `Sure, here it is.`,
    outputDelay: 1500, // 1.5 seconds delay before showing output
    action: (onComplete) => {
      setActiveTab("Monitor");
      setTabContent(
        <MonitorTab
          images={[
            "/images/neo-vision/monitor/monitor1.svg",
            "/images/neo-vision/monitor/monitor2.svg",
          ]}
          imagesPerRow={1}
        />
      );
      setTimeout(() => {
        showCustomToast('P95 latency increased by 65% due to endpoint overload. Scaling up by 2 nodes to reduce latency.', 'sucess', 5000)
        onComplete();
      }, 3000);
    },
    actionDelay: 2000, // 2 seconds delay before starting action
  },
  {
    input: "How can I test my deployed model locally?",
    output: "Here is the code to test your deployed model",
    outputDelay: 1000, // 1 second delay before showing output
    action: (onComplete) => {
      setActiveTab("Code");
      setTabContent(
        <CodeTab
          code={`import pyaudio
import wave
import requests
import simpleaudio as sa

API_URL = "https://2a4e9fc5-eed1-429c-af91-cb2535517b34.monsterapi.ai/v1/"
API_KEY = 'your_api_key'

# Audio recording settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024
RECORD_SECONDS = 5
OUTPUT_FILENAME = "output_audio.wav"

def record_audio():
    """Record audio from the microphone."""
    audio = pyaudio.PyAudio()

    # Start recording
    print("Recording...")
    stream = audio.open(format=FORMAT, channels=CHANNELS,
                        rate=RATE, input=True,
                        frames_per_buffer=CHUNK)
    frames = []

    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("Finished recording.")

    # Stop recording
    stream.stop_stream()
    stream.close()
    audio.terminate()

    # Save the recording to a WAV file
    wave_file = wave.open("input_audio.wav", 'wb')
    wave_file.setnchannels(CHANNELS)
    wave_file.setsampwidth(audio.get_sample_size(FORMAT))
    wave_file.setframerate(RATE)
    wave_file.writeframes(b''.join(frames))
    wave_file.close()

    return "input_audio.wav"

def send_audio_to_api(audio_file):
    """Send the recorded audio to the speech-to-speech API and get the response."""
    with open(audio_file, 'rb') as audio:
        response = requests.post(
            API_URL,
            headers={'Authorization': f'Bearer {API_KEY}'},
            files={'audio': audio}
        )

    if response.status_code == 200:
        print("Received audio response from API.")
        # Save the output audio to a file
        with open(OUTPUT_FILENAME, 'wb') as output_audio:
            output_audio.write(response.content)
        return OUTPUT_FILENAME
    else:
        print("Error:", response.text)
        return None

def play_audio(file):
    """Play the returned audio using simpleaudio."""
    wave_obj = sa.WaveObject.from_wave_file(file)
    play_obj = wave_obj.play()
    play_obj.wait_done()  # Wait until the sound has finished playing

def main():
    # Step 1: Record audio from microphone
    input_audio = record_audio()

    # Step 2: Send the recorded audio to the API
    output_audio = send_audio_to_api(input_audio)

    # Step 3: Play the output audio if the API call was successful
    if output_audio:
        play_audio(output_audio)

if __name__ == "__main__":
    main()`}
          language="python"
          onComplete={onComplete}
        />
      );
    },
    actionDelay: 2000, // 2 seconds delay before starting action
    followUp: "Keep your API key secret and don't share it with anyone.",
    followUpDelay: 1500, // 1.5 seconds delay before showing followUp
  },
  {
    input: "show image",
    output: "Here is the image you requested",
    outputDelay: 1000, // 1 second delay before showing output
    action: (onComplete) => {
      setActiveTab("Artifact Viewer");
      setTabContent(
        <ArtifactViewer content="https://png.pngtree.com/thumb_back/fw800/background/20230817/pngtree-lotus-flower-jpg-pink-lotus-flower-image_13023952.jpg" />
      );
      setTimeout(onComplete, 2000);
    },
    actionDelay: 2000, // 2 seconds delay before starting action
  },
  {
    input: "show code",
    output: "Here is the code you requested",
    outputDelay: 1000, // 1 second delay before showing output
    action: (onComplete) => {
      setActiveTab("Artifact Viewer");
      setTabContent(<ArtifactViewer content={`
        import pyaudio
        import wave
        import requests
        import simpleaudio as sa`} type="code" language="python" />);
      setTimeout(onComplete, 2000);
    },
    actionDelay: 2000, // 2 seconds delay before starting action
  },
  
];
