import React from 'react';

const FormatPreview = ({ format, onSelect, isSelected }) => {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onSelect(format)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{format.label}</h3>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-gray-600 text-sm">{format.description}</p>
      </div>
      
      <div className="bg-gray-100 rounded p-3 h-32 overflow-hidden">
        <img 
          src={format.previewImage} 
          alt={`${format.label} preview`} 
          className="w-full object-cover"
        />
      </div>
    </div>
  );
};

const FormatSelector = ({ selectedFormat, onSelectFormat }) => {
  const formats = [
    {
      id: 'html',
      label: 'HTML Documentation',
      description: 'Interactive web-based documentation with navigation and syntax highlighting.',
      previewImage: '/images/preview-html.png'
    },
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Printable document format with table of contents and page numbers.',
      previewImage: '/images/preview-pdf.png'
    },
    {
      id: 'markdown',
      label: 'Markdown Files',
      description: 'GitHub-compatible documentation that can be included in repositories.',
      previewImage: '/images/preview-markdown.png'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {formats.map(format => (
        <FormatPreview
          key={format.id}
          format={format}
          isSelected={selectedFormat === format.id}
          onSelect={() => onSelectFormat(format.id)}
        />
      ))}
    </div>
  );
};

export default FormatSelector;