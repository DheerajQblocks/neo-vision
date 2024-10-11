import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';

const ArtifactViewer = ({ content }) => {
  if (content.startsWith('`') && content.endsWith('`')) {
    // Extract code block
    const code = content.slice(1, -1).trim();
    return (
      <SyntaxHighlighter language="python" style={vscDarkPlus}>
        {code}
      </SyntaxHighlighter>
    );
  } else if (content.match(/\.(jpeg|jpg|gif|png)$/) != null) {
    // Check if content is an image URL
    return <img src={content} alt="Artifact" className="w-full h-auto rounded-lg" />;
  } else {
    // Render as markdown
    return <Markdown>{content}</Markdown>;
  }
};

export default ArtifactViewer;