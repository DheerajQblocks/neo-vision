import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { FiFolder, FiFolderPlus, FiFile, FiTerminal, FiSave, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import TerminalCustome from './TerminalCustome';
import { debounce } from 'lodash';

const FileBrowserCodeViewer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileTree, setFileTree] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [isCLIOpen, setIsCLIOpen] = useState(true);
  const [theme, setTheme] = useState('vs-dark');
  const [language, setLanguage] = useState('javascript');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFileHandle, setCurrentFileHandle] = useState(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

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
    return files.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  };

  const handleDirectoryOpen = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const files = await readDirectory(directoryHandle);
      setFileTree(files);
      setIsSidebarOpen(true);
    } catch (error) {
      console.error('Error accessing directory:', error);
    }
  };

  const handleFileClick = async (fileHandle) => {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      setSelectedFile(file.name);
      setFileContent(content);
      setLanguage(getLanguageFromFileName(file.name));
      setCurrentFileHandle(fileHandle);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const getLanguageFromFileName = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      // Add more mappings as needed
    };
    return languageMap[extension] || 'plaintext';
  };

  const toggleDirectory = (dirName) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dirName)) {
        newSet.delete(dirName);
      } else {
        newSet.add(dirName);
      }
      return newSet;
    });
  };

  const renderFileTree = (nodes, parentPath = '') => {
    return nodes.map((node) => {
      const currentPath = `${parentPath}/${node.name}`;
      if (node.type === 'file') {
        return (
          <div
            key={currentPath}
            className="flex items-center space-x-2 cursor-pointer pl-4 py-1 hover:bg-gray-700"
            onClick={() => handleFileClick(node.handle)}
          >
            <FiFile className="text-blue-400" />
            <span>{node.name}</span>
          </div>
        );
      } else if (node.type === 'directory') {
        return (
          <div key={currentPath}>
            <div
              className="flex items-center space-x-2 font-bold cursor-pointer py-1 hover:bg-gray-700"
              onClick={() => toggleDirectory(currentPath)}
            >
              {expandedDirs.has(currentPath) ? (
                <FiFolder className="text-yellow-400" />
              ) : (
                <FiFolderPlus className="text-yellow-400" />
              )}
              <span>{node.name}</span>
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

  const saveFile = async (content) => {
    if (currentFileHandle && content) {
      try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  const debouncedSave = useCallback(
    debounce((content) => {
      if (isAutoSaveEnabled) {
        saveFile(content);
      }
    }, 1000),
    [currentFileHandle, isAutoSaveEnabled]
  );

  const handleContentChange = (value) => {
    setFileContent(value);
    debouncedSave(value);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleAutoSave = () => {
    setIsAutoSaveEnabled(prev => !prev);
  };

  return (
    <div className={`flex flex-col h-screen ${theme === 'vs-dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="flex-1 flex">
        <div className={`${isSidebarOpen ? 'w-1/4' : 'w-10'} bg-gray-800 text-white p-2 transition-all duration-300 ease-in-out`}>
          <button
            onClick={toggleSidebar}
            className="mb-4 p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            {isSidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
          {isSidebarOpen && (
            <>
              <button
                onClick={handleDirectoryOpen}
                className="flex items-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded mb-4 hover:bg-blue-600 transition-colors"
              >
                <FiFolder />
                <span>Open Directory</span>
              </button>
              <div>{renderFileTree(fileTree)}</div>
            </>
          )}
        </div>
        <div className="flex-1 p-2 flex flex-col">
          {selectedFile ? (
            <>
              <div className="flex justify-between mb-2">
                <div className="text-lg font-bold">{selectedFile}</div>
                <div className="space-x-2">
                  <button
                    onClick={() => saveFile(fileContent)}
                    className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition-colors"
                  >
                    <FiSave />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="bg-purple-500 text-white py-1 px-3 rounded hover:bg-purple-600 transition-colors"
                  >
                    <FiRefreshCw />
                  </button>
                  <button
                    onClick={toggleAutoSave}
                    className={`py-1 px-3 rounded transition-colors ${
                      isAutoSaveEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    Auto-Save: {isAutoSaveEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <Editor
                height="100%"
                language={language}
                value={fileContent}
                onChange={handleContentChange}
                theme={theme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {fileTree.length > 0 ? 'Select a file to view/edit' : 'Open a directory to start'}
            </div>
          )}
        </div>
      </div>
      <div className="h-1/4 bg-black">
        {isCLIOpen && <TerminalCustome />}
      </div>
    </div>
  );
};

export default FileBrowserCodeViewer;