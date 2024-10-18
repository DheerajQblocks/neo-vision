import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const MLTaskForm = ({ onSubmit, isUserInputRequired, firstTimeQuery, value, setInputValue }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e) => {
    // e.preventDefault();
    onSubmit(e);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-end bg-[#2D2D44] rounded-2xl py-2 px-4 overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isUserInputRequired || firstTimeQuery ? "Provide an ML task" : "Waiting for response..."}
          className="flex-1 overflow-auto bg-transparent border-none text-white py-2 px-2 focus:outline-none resize-vertical"
          disabled={!isUserInputRequired && !firstTimeQuery}
          ref={textareaRef}
          rows={1}
          style={{ minHeight: '40px', maxHeight: '300px' }}
        />
        <button
          type="submit"
          className="bg-[#4A4A6A] rounded-full border-none p-3 ml-2 flex-shrink-0 self-end"
          disabled={!isUserInputRequired && !firstTimeQuery}
        >
          <Send size={20} className="text-white" />
        </button>
      </div>
    </form>
  );
};

export default MLTaskForm;