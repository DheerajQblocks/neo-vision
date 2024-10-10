import React, { useState, useRef, useEffect } from 'react';

const TerminalCustome = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(['Welcome to the Neo CLI']);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const command = input.trim().toLowerCase();
    let response;

    switch (command) {
      case 'help':
        response = 'Available commands: help, clear, echo <message>, date';
        break;
      case 'clear':
        setOutput([]);
        setInput('');
        return;
      case 'date':
        response = new Date().toString();
        break;
      default:
        if (command.startsWith('echo ')) {
          response = command.slice(5);
        } else {
          response = `Command not found: ${command}`;
        }
    }

    // Add dummy response with artifacts
    if (command === 'show artifacts') {
      response = `
        Here are some artifacts:
        \`\`\`javascript
        console.log('Hello, World!');
        \`\`\`
        \`\`\`markdown
        # Markdown Example
        - Item 1
        - Item 2
        \`\`\`
        \`\`\`image
        ![Sample Image](https://via.placeholder.com/150)
        \`\`\`
      `;
    }

    setOutput([...output, `$ ${input}`, response]);
    setInput('');
  };

  return (
    <div className="bg-black text-green-500 p-4 font-mono h-96 overflow-y-auto">
      {output.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      <form onSubmit={handleSubmit} className="mt-2">
        <span>$ </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="bg-black text-green-500 focus:outline-none w-11/12"
        />
      </form>
    </div>
  );
};

export default TerminalCustome;