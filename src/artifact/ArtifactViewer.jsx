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
    <div className="artifact-viewer">
      <div className="p-4"> No artifact found </div>
    </div>
  )
  return (
    <div className="artifact-viewer">
      {type === "code" ? (
        <div className="code-container">
          <div className="flex justify-between items-center px-4 py-2 bg-[#2d2d44]">
            <span className="text-gray-300 text-sm">{language}</span>
            <button
              onClick={handleCopy}
              className="flex items-center bg-[#3d3d5c] text-gray-300 px-2 py-1 rounded text-sm transition-colors duration-200 hover:bg-[#4d4d7a]"
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
