import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaCopy } from "react-icons/fa6";
import "./ArtifactViewer.css";

const ArtifactViewer = ({ content, type = "code", language = "python" }) => {

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if(!content) return (
    <div className="artifact-viewer h-full">
      <div className="p-4 text-[#cccccc] justify-center items-center flex h-full bg-[#37373d]"> No artifact found </div>
    </div>
  )
  return (
    <div className="artifact-viewer bg-[#1e1e1e]">
      {type === "code" ? (
        <div className="code-container">
          <div className="flex justify-between items-center px-4 py-2 bg-[#252526]">
            <span className="text-[#cccccc] text-sm">{language}</span>
            <button
              onClick={handleCopy}
              className="flex items-center bg-[#37373d] text-[#cccccc] px-2 py-1 rounded text-sm transition-colors duration-200 hover:bg-[#2d2d30]"
            >
              <FaCopy className="mr-1" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, background: "transparent" }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <img src={content} alt="Artifact" className="artifact-image" />
      )}
    </div>
  );
};

export default ArtifactViewer;
