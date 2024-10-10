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

  const renderArtifact = (content) => {
    const artifactRegex = /```(.*?)\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(artifactRegex)];

    return matches.map((match, index) => {
      const [fullMatch, type, artifactContent] = match;
      switch (type.trim()) {
        case 'javascript':
          return (
            <pre key={index} className="bg-gray-800 text-white p-2 rounded">
              <code>{artifactContent}</code>
            </pre>
          );
        case 'markdown':
          return (
            <div key={index} className="bg-gray-100 p-2 rounded">
              <Markdown>{artifactContent}</Markdown>
            </div>
          );
        case 'image':
          return (
            <div key={index} className="p-2">
              <img src={artifactContent.trim()} alt="Artifact" />
            </div>
          );
        default:
          return <pre key={index}>{fullMatch}</pre>;
      }
    });
  };

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
          {renderArtifact(fileContent)}
        </div>
      )}
    </div>
  );
};

export default FileBrowserCodeViewer;