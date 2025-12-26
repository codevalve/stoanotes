
import React from 'react';

interface MarkdownViewProps {
  content: string;
}

const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-4 font-serif-stoic text-stone-900 dark:text-stone-100">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mb-3 font-serif-stoic text-stone-900 dark:text-stone-100">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mb-2 font-serif-stoic text-stone-900 dark:text-stone-200">{line.slice(4)}</h3>;
        
        // Lists
        if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 list-disc text-stone-800 dark:text-stone-300">{line.slice(2)}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 mb-1 list-decimal text-stone-800 dark:text-stone-300">{line.replace(/^\d+\. /, '')}</li>;
        
        // Blockquotes
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-stone-300 dark:border-stone-700 pl-4 italic mb-4 text-stone-600 dark:text-stone-400">{line.slice(2)}</blockquote>;

        // Empty line
        if (line.trim() === '') return <div key={i} className="h-4"></div>;

        // Paragraph
        return <p key={i} className="mb-2 leading-relaxed text-stone-800 dark:text-stone-300">{line}</p>;
      });
  };

  return (
    <div className="prose prose-stone max-w-none">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownView;
