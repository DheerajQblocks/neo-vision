import React, { useRef, useEffect, useState } from 'react';

const AudioPlayer = ({ audioSrc, onEnded }) => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let audioContext;
    let analyser;
    let dataArray;

    const setupAudioContext = () => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    };

    const visualize = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;

        const r = barHeight + 25 * (i / dataArray.length);
        const g = 250 * (i / dataArray.length);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationId = requestAnimationFrame(visualize);
    };

    const startVisualization = () => {
      if (!audioContext) setupAudioContext();
      visualize();
    };

    const stopVisualization = () => {
      cancelAnimationFrame(animationId);
    };

    audio.addEventListener('play', startVisualization);
    audio.addEventListener('pause', stopVisualization);
    audio.addEventListener('ended', onEnded);

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    return () => {
      audio.removeEventListener('play', startVisualization);
      audio.removeEventListener('pause', stopVisualization);
      audio.removeEventListener('ended', onEnded);
      stopVisualization();
      if (audioContext) audioContext.close();
    };
  }, [onEnded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = 'audio.mp3'; // You can customize the filename here
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
      <canvas
        ref={canvasRef}
        width="300"
        height="100"
        className="w-full mb-4"
      />
      <audio ref={audioRef} src={audioSrc} className="hidden" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex space-x-2">
          <button
            onClick={togglePlayPause}
            className="bg-blue-500 border-none text-white px-4 py-2 rounded-full focus:outline-none hover:bg-blue-600 transition"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-500 border-none text-white px-4 py-2 rounded-full focus:outline-none hover:bg-green-600 transition"
          >
            Download
          </button>
        </div>
        <div className="text-white font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <div className="bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default AudioPlayer;
