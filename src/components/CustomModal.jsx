import React from 'react';

const CustomModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#252526] border border-[#007acc] rounded-lg p-6 max-w-md w-full">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CustomModal;
