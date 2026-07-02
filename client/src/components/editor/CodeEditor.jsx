import { useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, setCode, language, sendOp, versionRef }) => {
  const prevCodeRef = useRef(code);

  const handleChange = (newValue) => {
    if (newValue === undefined) return;

    const prev = prevCodeRef.current;
    const next = newValue;
    prevCodeRef.current = next;
    setCode(next);

    // Compute the op by comparing prev and next
    // Find first differing character
    let i = 0;
    while (i < prev.length && i < next.length && prev[i] === next[i]) i++;

    if (next.length > prev.length) {
      // Insert
      const inserted = next.slice(i, i + (next.length - prev.length));
      sendOp({ type: 'insert', position: i, text: inserted });
    } else if (next.length < prev.length) {
      // Delete
      const deletedLength = prev.length - next.length;
      sendOp({ type: 'delete', position: i, length: deletedLength });
    }
  };

  return (
    <Editor
      height="100%"
      language={language === 'cpp' ? 'cpp' : language}
      value={code}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
      }}
    />
  );
};

export default CodeEditor;