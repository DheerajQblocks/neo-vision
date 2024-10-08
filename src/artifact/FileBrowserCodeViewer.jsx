import React, { useState, useCallback, useEffect } from 'react';

const FileBrowserCodeViewer = () => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
        setError('');
        setExecutionResult('');
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(file);
    }
  }, []);

  const executeCode = useCallback(() => {
    if (!fileContent) {
      setError('No code to execute');
      return;
    }

    setIsExecuting(true);
    setError('');
    setExecutionResult('');

    // Use a worker for safer execution
    const blob = new Blob([`
      self.onmessage = function(e) {
        try {
          const result = eval(e.data);
          self.postMessage({ result: result !== undefined ? result.toString() : 'undefined' });
        } catch (error) {
          self.postMessage({ error: error.toString() });
        }
      }
    `], { type: 'application/javascript' });

    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      setIsExecuting(false);
      if (e.data.error) {
        setError(`Execution error: ${e.data.error}`);
      } else {
        setExecutionResult(e.data.result);
      }
      worker.terminate();
    };

    worker.onerror = (e) => {
      setIsExecuting(false);
      setError(`Worker error: ${e.message}`);
      worker.terminate();
    };

    worker.postMessage(fileContent);
  }, [fileContent]);

  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return (
    <div style={{ padding: '1rem', maxWidth: '42rem', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>File Browser, Code Viewer, and Executor</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="file-upload" style={{ cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', display: 'inline-flex', alignItems: 'center' }}>
          📁 Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".js,.txt"
        />
      </div>
      {error && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '0.25rem', padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ color: '#b91c1c', fontWeight: 'bold' }}>Error</p>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      )}
      {fileName && <p style={{ marginBottom: '0.5rem' }}>Selected file: {fileName}</p>}
      {fileContent && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'semibold', marginBottom: '0.5rem' }}>File Content:</h2>
          <pre style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.25rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            <code className='text-black'>{fileContent}</code>
          </pre>
          <button 
            onClick={executeCode} 
            disabled={isExecuting}
            style={{ 
              backgroundColor: isExecuting ? '#9ca3af' : '#10b981', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem', 
              marginTop: '1rem',
              cursor: isExecuting ? 'not-allowed' : 'pointer'
            }}
          >
            {isExecuting ? 'Executing...' : 'Execute Code'}
          </button>
        </div>
      )}
      {executionResult && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'semibold', marginBottom: '0.5rem' }}>Execution Result:</h2>
          <pre style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '0.25rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {executionResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileBrowserCodeViewer;