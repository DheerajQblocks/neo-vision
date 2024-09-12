import React from 'react';
// import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer';
import { FaCopy } from 'react-icons/fa6';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './NewNEO.css';

// eslint-disable-next-line react/prop-types
const CodeTab = ({ code, language = 'python', onComplete }) => {
  const [displayedCode, setDisplayedCode] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const codeContainerRef = React.useRef(null);

  React.useEffect(() => {
    setDisplayedCode('');
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
          {copied ? 'Copied!' : 'Copy'}
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
            customStyle={{ margin: 0, background: 'transparent' }}
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
      'Hey Neo! I need a voice agent that can handle 100K calls in Spanish.',
    output: `I see. I'd like to suggest finetuning approach for this. Do you have a dataset or should I curate one from online resources?`,
  },
  {
    input: `Yes, I have a s3 data bucket. Here it is: s3://stt-spanish-english-data/audio-train-00253.parquet`,
    output: `Your dataset has few samples. I'll augment it by adding more and diversifying to cover a wider range of use cases.`,
    action: (onComplete) => {
      setActiveTab('Browse');
      setTabContent(
        <BrowseTab
          videoSrc="/images/neo-vision/hf.mov"
          onVideoEnd={onComplete}
        />
      );
    },
    followUp: `I've increased the sample size, improved the quality of dataset, reformatted it and now we can proceed with the finetuning experiments.
      
      Let me know if you have any preferred hyperparameters or training configurations.
      `,
  },
  {
    input: 'No, please proceed with your experimentation!',
    output: 'Found the best model. Should I deploy it?',
    action: (onComplete) => {
      setActiveTab('Monitor');
      const imagesToShow = [
        '/images/neo-vision/finetune-experiment/finetune1.svg',
        '/images/neo-vision/finetune-experiment/finetune2.svg',
        '/images/neo-vision/finetune-experiment/finetune3.svg',
        '/images/neo-vision/finetune-experiment/finetune4.svg',
        '/images/neo-vision/finetune-experiment/finetune5.svg',
      ];
      setTabContent(
        <MonitorTab
          images={imagesToShow}
          imagesPerRow={2} // Set this to 1 for one image per row, 2 for two images per row, etc.
        />
      );
      setTimeout(onComplete, 5000);
    },
  },
  {
    input: 'Yes Deploy it',
    output: `For optimized inference I am considering below implementations and executing them

- Serving engines:
  - CTranslate2
  - Huggingface
  - WhisperX
  - Huggingface FA2
- Compute type:
  - Float16
  - Float32
- Different GPU types`,
    action: (onComplete) => {
      setActiveTab('Monitor');
      setTabContent(
        <MonitorTab
          images={[
            '/images/neo-vision/latency-chart/latency1.svg',
            '/images/neo-vision/latency-chart/latency2.svg',
          ]}
          imagesPerRow={1}
        />
      );
      setTimeout(onComplete, 1000);
    },
    followUp: `Here are the charts for latency distributions and cost analysis based on my experiments and I am going forward with using A100 GPU servers for deployment with FP16 compute type.

I am considering the following conditions for auto-scaling pipeline:

- US timezone
- 100K sessions per day
- Peak concurrency at 50 requests

Should I proceed?`,
  },

  {
    input: 'Yes, go ahead.',
    output: 'Setting up the deployment on your AWS cloud account.',
    action: (onComplete) => {
      // Simulate a delay before showing the followUp
      setTimeout(() => {
        onComplete();
      }, 3000); // 3 seconds delay
    },
    followUp: `Service is live at endpoint:
https://2a4e9fc5-eed1-429c-af91-cb2535517b34.monsterapi.ai/docs

You can take the following actions:
[action]Try out the deployment Service[/action]
[action]Performance Monitoring dashboard[/action]
[action]Create a service alarm[/action]
[action]Create a autonomous action[/action]
  `,
  },

  {
    input: 'Try out the deployment Service',
    output: 'Please give me a audio sample',
  },

  {
    input: 'How can i test my deployed model?',
    output: 'Here is the code to test your deployed model',
    action: (onComplete) => {
      setActiveTab('Code');
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
    followUp: "Keep your API key secret and don't share it with anyone.",
  },

  // {
  //   input: 'Tell me a joke',
  //   output:
  //     "Sure, I'd be happy to tell you a joke. Please listen to the audio response.",
  //   action: (onComplete) => {
  //     setActiveTab('Chat');
  //     setTabContent(
  //       <AudioPlayer
  //         audioSrc="/images/neo-vision/audio.mp3"
  //       // onEnded={onComplete}
  //       />
  //     );
  //     setTimeout(onComplete, 500);
  //   },
  //   followUp:
  //     "I hope you enjoyed that joke! Let me know if you'd like to hear another one.",
  // },
];
