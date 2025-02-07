"use client";

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faThumbtack, 
  faFolder, 
  faSave, 
  faTag, 
  faBold, 
  faItalic, 
  faHeading,
  faListUl,
  faListOl,
  faQuoteLeft,
  faLink,
  faImage,
  faEye,
  faEyeSlash,
  faChevronDown,
  faTrash 
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast'; // Change from react-toastify to react-hot-toast

export default function Editor({ note, onUpdate, onDelete, folders, tags, onClose }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [selectedFolder, setSelectedFolder] = useState(note?.folderId?._id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState(note?.tags?.map(t => t._id) || []);
  const [isFirstEdit, setIsFirstEdit] = useState(true);
  const [showPreview, setShowPreview] = useState(!!note?.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setIsPinned(note?.isPinned || false);
    setSelectedFolder(note?.folderId?._id || '');
    setSelectedTags(note?.tags?.map(t => t._id) || []);
    // Set preview mode based on content existence
    setShowPreview(!!note?.content);
  }, [note]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await onUpdate({
        title: title || 'Untitled',
        content,
        isPinned,
        folderId: selectedFolder || null,
        tags: selectedTags
      });

      if (!response) {
        throw new Error('Failed to update note');
      }

      toast.success("Note saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteModal(false);
    toast.success("Note deleted successfully");
    onClose();
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const textareaRef = useRef(null);

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + 
                   before + selectedText + after + 
                   content.substring(end);
    
    setContent(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const markdownUtils = [
    {
      icon: faBold,
      title: 'Bold',
      action: () => insertText('**', '**')
    },
    {
      icon: faItalic,
      title: 'Italic',
      action: () => insertText('*', '*')
    },
    {
      icon: faHeading,
      title: 'Heading',
      action: () => insertText('### ')
    },
    {
      icon: faListUl,
      title: 'Bullet List',
      action: () => insertText('- ')
    },
    {
      icon: faListOl,
      title: 'Numbered List',
      action: () => insertText('1. ')
    },
    {
      icon: faQuoteLeft,
      title: 'Quote',
      action: () => insertText('> ')
    },
    {
      icon: faLink,
      title: 'Link',
      action: () => insertText('[', '](url)')
    },
    {
      icon: faImage,
      title: 'Image',
      action: () => insertText('![alt text](', ')')
    }
  ];

  // Modify processContent to handle markdown patterns better
  const processContent = (text) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.match(/^#{1,6}\s/)) {
        return `<span class="text-blue-400">${line}</span>`;
      }
      // Lists
      if (line.match(/^[\s]*[-*+]\s/)) {
        return `<span class="text-green-400">${line}</span>`;
      }
      // Numbered lists
      if (line.match(/^[\s]*\d+\.\s/)) {
        return `<span class="text-green-400">${line}</span>`;
      }
      // Blockquotes
      if (line.match(/^>\s/)) {
        return `<span class="text-yellow-400">${line}</span>`;
      }
      // Regular text - don't add any styling
      return line;
    }).join('\n');
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (isFirstEdit) {
      setIsFirstEdit(false);
    }
  };

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-2 bg-base-300 rounded-lg">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="input input-sm flex-1 min-w-[200px]"
          />
          
          {/* Markdown Utils with Preview Toggle */}
          <div className="flex items-center gap-1 p-1 bg-base-200 rounded-lg">
            {!showPreview && markdownUtils.map((util, index) => (
              <button
                key={index}
                className="btn btn-sm btn-ghost"
                onClick={util.action}
                title={util.title}
              >
                <FontAwesomeIcon icon={util.icon} />
              </button>
            ))}
            <button
              className={`btn btn-sm ${showPreview ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide Preview" : "Show Preview"}
            >
              <FontAwesomeIcon icon={showPreview ? faEyeSlash : faEye} />
            </button>
          </div>

          {/* Folder and Tags Container */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Updated Folder Select */}
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="select select-sm min-w-[200px]"
            >
              <option value="">No Folder</option>
              {folders.map(folder => (
                <option 
                  key={folder._id} 
                  value={folder._id}
                >
                  {folder.name} {folder._id === note.folderId?._id ? '(Current)' : ''}
                </option>
              ))}
            </select>

            {/* Updated Tags Dropdown */}
            <div className="dropdown dropdown-bottom z-50">
              <label tabIndex={0} className="btn btn-sm gap-1 min-w-[150px] justify-between">
                <span className="truncate">
                  {selectedTags.length === 0 
                    ? "Select Tags" 
                    : `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
              </label>
              <div 
                tabIndex={0} 
                className="dropdown-content menu p-2 shadow bg-base-200 rounded-lg w-52 max-h-[300px] overflow-y-auto flex-nowrap"
              >
                <div className="flex flex-col w-full">
                  {tags.map(tag => (
                    <label 
                      key={tag._id} 
                      className="flex items-center gap-2 p-2 hover:bg-base-300 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedTags.includes(tag._id)}
                        onChange={() => toggleTag(tag._id)}
                      />
                      <span 
                        className="flex-1 flex items-center gap-2 truncate"
                        style={{ 
                          color: tag.color,
                          fontWeight: selectedTags.includes(tag._id) ? 'bold' : 'normal' 
                        }}
                      >
                        <FontAwesomeIcon icon={faTag} className="shrink-0" />
                        <span className="truncate">{tag.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Pin Button */}
            <button
              className={`btn btn-sm ${isPinned ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setIsPinned(!isPinned)}
            >
              <FontAwesomeIcon icon={faThumbtack} />
            </button>
          </div>

          {/* Updated Save/Cancel/Delete Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="btn btn-sm btn-error"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Close
            </button>
            <button
              className="btn btn-sm btn-primary gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              <FontAwesomeIcon icon={faSave} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div className="flex-1 bg-base-100 rounded-lg overflow-auto relative">
          {!showPreview ? (
            <div className="relative h-full">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange} // Use new handler
                className="absolute top-0 left-0 w-full h-full p-4 bg-transparent focus:outline-none resize-none font-mono text-white"
                placeholder="Write your note here... (Markdown supported)"
                style={{ 
                  zIndex: 1,
                  caretColor: 'white'
                }}
              />
            </div>
          ) : (
            <div className="p-4 prose prose-invert prose-pre:bg-base-300 prose-pre:p-4 max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="border-b border-gray-600 pb-2 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="border-b border-gray-600 pb-2 mb-4" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-base-300 rounded-lg" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? 
                      <code className="bg-base-300 px-1 rounded" {...props} /> :
                      <code {...props} />,
                  blockquote: ({node, ...props}) => 
                    <blockquote className="border-l-4 border-gray-500 pl-4 text-gray-400" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Delete Note Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Note</h3>
            <p className="py-4">Are you sure you want to delete this note? This action cannot be undone.</p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}