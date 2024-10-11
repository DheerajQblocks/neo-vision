import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import TerminalCustome from './TerminalCustome'; // Import the TerminalCustome component

const FileBrowserCodeViewer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileTree, setFileTree] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [isCLIOpen, setIsCLIOpen] = useState(false); // State to manage CLI visibility

  const readDirectory = async (directoryHandle) => {
    const files = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
        files.push({ name: entry.name, handle: entry, type: 'file' });
      } else if (entry.kind === 'directory') {
        const subFiles = await readDirectory(entry);
        files.push({ name: entry.name, children: subFiles, type: 'directory' });
      }
    }
    return files;
  };

  const handleDirectoryOpen = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      const files = await readDirectory(directoryHandle);
      setFileTree(files);
    } catch (error) {
      console.error('Error accessing directory:', error);
    }
  };

  const handleFileClick = async (fileHandle) => {
    const file = await fileHandle.getFile();
    const content = await file.text();
    setSelectedFile(file.name);
    setFileContent(content);
  };

  const toggleDirectory = (dirName) => {
    const newExpandedDirs = new Set(expandedDirs);
    if (newExpandedDirs.has(dirName)) {
      newExpandedDirs.delete(dirName);
    } else {
      newExpandedDirs.add(dirName);
    }
    setExpandedDirs(newExpandedDirs);
  };

  const renderFileTree = (nodes, parentPath = '') => {
    return nodes.map((node) => {
      const currentPath = `${parentPath}/${node.name}`;
      if (node.type === 'file') {
        return (
          <div
            key={currentPath}
            className="cursor-pointer pl-4"
            onClick={() => handleFileClick(node.handle)}
          >
            {node.name}
          </div>
        );
      } else if (node.type === 'directory') {
        return (
          <div key={currentPath}>
            <div
              className="font-bold cursor-pointer"
              onClick={() => toggleDirectory(currentPath)}
            >
              {expandedDirs.has(currentPath) ? '📂' : '📁'} {node.name}
            </div>
            {expandedDirs.has(currentPath) && (
              <div className="ml-4">{renderFileTree(node.children, currentPath)}</div>
            )}
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="flex h-full">
      <div className="w-1/4 bg-gray-800 text-white p-2 overflow-y-auto">
        <button
          onClick={handleDirectoryOpen}
          className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
        >
          Open Directory
        </button>
        <div>{renderFileTree(fileTree)}</div>
        <button
          onClick={() => setIsCLIOpen(!isCLIOpen)} // Toggle CLI visibility
          className="bg-green-500 text-white py-2 px-4 rounded mt-4"
        >
          {isCLIOpen ? 'Hide CLI' : 'Show CLI'}
        </button>
      </div>
      <div className="w-3/4 p-2">
        {selectedFile ? (
          <Editor
            height="90vh"
            defaultLanguage="javascript"
            value={fileContent}
            onChange={(value) => setFileContent(value)}
          />
        ) : (
          <div>Select a file to view/edit</div>
        )}
        {isCLIOpen && <TerminalCustome />} {/* Conditionally render TerminalCustome */}
      </div>
    </div>
  );
};

export default FileBrowserCodeViewer;