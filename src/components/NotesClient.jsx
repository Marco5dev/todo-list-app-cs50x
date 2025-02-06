"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbtack,
  faFolder,
  faPlus,
  faFolderPlus,
  faPencil,
  faTag,
  faTrash,
  faTrashCan,
  faXmark,
  faArrowRight,
  faEllipsisVertical,
  faCheck,
  faPencilAlt,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import Editor from "@/components/Editor";
import LoadingFolderItem from "@/components/loadings/LoadingFolderItem";

export default function NotesClient({ session }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [tagChanges, setTagChanges] = useState(new Map());
  const [hasTagChanges, setHasTagChanges] = useState(false);
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(null);
  const [startInPreview, setStartInPreview] = useState(true); // Add this state
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true); // Add new state

  useEffect(() => {
    fetchNotes();
    fetchFolders();
    fetchTags();

    // Add listener for mobile drawer events
    const handleDrawerToggle = (e) => {
      setMobileDrawerOpen(e.detail?.open || false);
    };

    window.addEventListener("toggleMobileDrawer", handleDrawerToggle);
    return () => window.removeEventListener("toggleMobileDrawer", handleDrawerToggle);
  }, []);

  useEffect(() => {
    // Update drawer folders when mobile drawer is open
    if (mobileDrawerOpen) {
      window.dispatchEvent(new CustomEvent("updateNotesFoldersList", {
        detail: { folders, selectedFolder }
      }));
    }
  }, [folders, selectedFolder, mobileDrawerOpen]);

  useEffect(() => {
    // Add listener for new folder modal
    const handleNewFolder = () => {
      setIsNewFolderModalOpen(true);
      // Close the mobile drawer when opening modal
      window.dispatchEvent(
        new CustomEvent("toggleMobileDrawer", { detail: { open: false } })
      );
    };

    window.addEventListener("openNotesNewFolderModal", handleNewFolder);
    return () => window.removeEventListener("openNotesNewFolderModal", handleNewFolder);
  }, []);

  useEffect(() => {
    // Add listeners for folder interactions from mobile drawer
    const handleSelectFolder = (e) => {
      if (e.detail?.folder) {
        setSelectedFolder(e.detail.folder);
      } else {
        setSelectedFolder(null);
      }
    };

    const handleEditFolder = (e) => {
      if (e.detail?.folder) {
        setEditingFolder(e.detail.folder);
        setNewFolderName(e.detail.folder.name);
        setIsEditFolderModalOpen(true);
      }
    };

    const handleDeleteFolder = (e) => {
      if (e.detail?.folder) {
        setShowDeleteModal(e.detail.folder);
      }
    };

    window.addEventListener('selectNotesFolder', handleSelectFolder);
    window.addEventListener('editNotesFolder', handleEditFolder);
    window.addEventListener('deleteNotesFolder', handleDeleteFolder);

    return () => {
      window.removeEventListener('selectNotesFolder', handleSelectFolder);
      window.removeEventListener('editNotesFolder', handleEditFolder);
      window.removeEventListener('deleteNotesFolder', handleDeleteFolder);
    };
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();
      // Ensure data is an array
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch notes");
      setNotes([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    setIsFoldersLoading(true);
    try {
      const response = await fetch("/api/notes-folders");
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      toast.error("Failed to fetch folders");
    } finally {
      setIsFoldersLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      setTags(data);
    } catch (error) {
      toast.error("Failed to fetch tags");
    } finally {
      setIsTagsLoading(false); // Add this line
    }
  };

  const createEmptyNote = async () => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "",
          userId: session.user.id,
          folderId: null,
          tags: [],
          isPinned: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to create note");
      }

      const newNote = await response.json();
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateNote = async (noteId, updates) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update note");
      }

      const updatedNote = await response.json();
      setNotes(notes.map((note) => (note._id === noteId ? updatedNote : note)));
      if (selectedNote?._id === noteId) {
        setSelectedNote(updatedNote);
      }
      return updatedNote;
    } catch (error) {
      toast.error(error.message);
      throw error; // Re-throw to handle in Editor component
    }
  };

  const togglePin = async (noteId) => {
    const note = notes.find((n) => n._id === noteId);
    if (note) {
      await updateNote(noteId, { isPinned: !note.isPinned });
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/notes-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      const newFolder = await response.json();
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleTagColorChange = async (tagId, color) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      const updatedTag = await response.json();
      setTags(tags.map((tag) => (tag._id === tagId ? updatedTag : tag)));
    } catch (error) {
      toast.error("Failed to update tag color");
    }
  };

  const handleTagNameChange = async (tagId, name) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const updatedTag = await response.json();
      setTags(tags.map((tag) => (tag._id === tagId ? updatedTag : tag)));
    } catch (error) {
      toast.error("Failed to update tag name");
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
      setTags(tags.filter((tag) => tag._id !== tagId));
      toast.success("Tag deleted successfully");
    } catch (error) {
      toast.error("Failed to delete tag");
    }
    setShowDeleteTagModal(null);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName }),
      });
      const newTag = await response.json();
      setTags([...tags, newTag]);
      setNewTagName("");
    } catch (error) {
      toast.error("Failed to create tag");
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleEditFolder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/notes-folders/${editingFolder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      const updatedFolder = await response.json();
      setFolders(
        folders.map((f) => (f._id === editingFolder._id ? updatedFolder : f))
      );
      setIsEditFolderModalOpen(false);
      setEditingFolder(null);
      setNewFolderName("");
      toast.success("Folder updated successfully");
    } catch (error) {
      toast.error("Failed to update folder");
    }
  };

  const deleteFolder = async (folderId, deleteNotes = false) => {
    try {
      const response = await fetch(
        `/api/notes-folders/${folderId}?deleteNotes=${deleteNotes}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete folder");
      }

      setFolders(folders.filter((f) => f._id !== folderId));

      // Update notes state based on deletion choice
      if (deleteNotes) {
        setNotes(notes.filter((note) => note.folderId?._id !== folderId));
      } else {
        setNotes(
          notes.map((note) =>
            note.folderId?._id === folderId ? { ...note, folderId: null } : note
          )
        );
      }

      // Reset selected folder if it was deleted
      if (selectedFolder?._id === folderId) {
        setSelectedFolder(null);
      }

      toast.success(
        deleteNotes
          ? "Folder and notes deleted successfully"
          : "Folder deleted and notes moved to root"
      );
    } catch (error) {
      toast.error(error.message);
    }
    setShowDeleteModal(null);
  };

  const handleTagChange = (tagId, changes) => {
    const newChanges = new Map(tagChanges);
    newChanges.set(tagId, { ...tagChanges.get(tagId), ...changes });
    setTagChanges(newChanges);
    setHasTagChanges(true);
  };

  const saveTagChanges = async () => {
    try {
      const promises = Array.from(tagChanges.entries()).map(
        ([tagId, changes]) =>
          fetch(`/api/tags/${tagId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(changes),
          })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      setTags(
        tags.map((tag) => {
          const updatedTag = results.find((r) => r._id === tag._id);
          return updatedTag || tag;
        })
      );

      setTagChanges(new Map());
      setHasTagChanges(false);
      toast.success("Tags updated successfully");
    } catch (error) {
      toast.error("Failed to update tags");
    }
  };

  const discardTagChanges = () => {
    setTagChanges(new Map());
    setHasTagChanges(false);
    fetchTags(); // Refresh tags from server
  };

  const deleteNote = async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(notes.filter((note) => note._id !== noteId));
      setSelectedNote(null);
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const filteredNotes = (notes || []).filter((note) => {
    // Add null check and ensure notes is an array
    if (!Array.isArray(notes)) return [];
    
    // Filter by folder
    if (selectedFolder && note.folderId?._id !== selectedFolder._id) {
      return false;
    }
    // Fix tags filtering - compare with populated tag IDs
    if (selectedTags.length > 0) {
      return selectedTags.every((tagId) =>
        note.tags?.some((tag) => tag._id === tagId)
      );
    }
    return true;
  });

  // Helper function to determine text color based on background
  const getContrastText = (hexcolor) => {
    // Convert hex to RGB
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "text-gray-800" : "text-white";
  };

  const getLuminanceFromHex = (hex) => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance;
  };

  const getTextColorForHex = (hex) => {
    const luminance = getLuminanceFromHex(hex);
    return luminance > 0.5 ? "text-black" : "text-white";
  };

  return (
    <div className="w-[95%] h-5/6 mt-24 flex">
      {/* Hide sidebar on mobile */}
      <div className="hidden lg:block w-1/4 bg-base-300 p-4 rounded-lg mr-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Folders</h2>
        <div className="flex-1 overflow-auto h-5/6">
          {isFoldersLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <LoadingFolderItem key={i} />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No folders created yet</p>
              <p className="text-sm">
                Create a folder to organize your notes
              </p>
            </div>
          ) : (
            <ul className="space-y-2 h-full">
              <li key="all-notes">
                <div
                  className={`flex items-center gap-2 p-2 hover:bg-base-400 rounded ${
                    !selectedFolder ? "bg-base-400" : ""
                  }`}
                  onClick={() => setSelectedFolder(null)}
                >
                  <div
                    className={`cursor-pointer flex-grow flex items-center gap-2 ${
                      !selectedFolder ? "text-primary font-bold" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
                    All Notes
                  </div>
                </div>
              </li>
              {folders.map((folder) => (
                <li key={folder._id}>
                  <div
                    className={`flex items-center gap-2 p-2 hover:bg-base-400 rounded ${
                      selectedFolder?._id === folder._id ? "bg-base-400" : ""
                    }`}
                  >
                    <div
                      onClick={() =>
                        !editingFolder && setSelectedFolder(folder)
                      }
                      className={`cursor-pointer flex-grow flex items-center gap-2 ${
                        selectedFolder?._id === folder._id
                          ? "text-primary font-bold"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
                      {folder.name}
                    </div>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm">
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
                      >
                        <li>
                          <button
                            onClick={() => {
                              setEditingFolder(folder);
                              setNewFolderName(folder.name);
                              setIsEditFolderModalOpen(true);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPencilAlt}
                              className="mr-2"
                            />{" "}
                            Rename
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => setShowDeleteModal(folder)}
                            className="text-error"
                          >
                            <FontAwesomeIcon
                              icon={faTrashAlt}
                              className="mr-2"
                            />{" "}
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setIsNewFolderModalOpen(true)}
          className="btn btn-primary mt-4 w-full"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New Folder
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Updated Tags Bar with responsive loading state */}
        <div className="bg-base-300 rounded-lg p-4 mb-4 flex items-center">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {isTagsLoading ? (
              <div className="flex gap-2 w-full overflow-x-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex-shrink-0">
                    <div className="h-8 w-16 sm:w-24 bg-base-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : tags.length === 0 ? (
              <p className="text-gray-500 text-sm">No tags created yet</p>
            ) : (
              (tags || []).map((tag) => {
                const isSelected = selectedTags.includes(tag._id);
                const textColorClass = isSelected
                  ? getTextColorForHex(tag.color)
                  : "text-gray-300";

                return (
                  <button
                    key={`tag-${tag._id}`}
                    className={`btn btn-sm border-none ${textColorClass}`}
                    onClick={() => toggleTag(tag._id)}
                    style={{
                      backgroundColor: isSelected ? tag.color : "transparent",
                      borderColor: tag.color,
                      ":hover": {
                        backgroundColor: tag.color,
                        opacity: 0.8,
                      },
                    }}
                  >
                    <FontAwesomeIcon icon={faTag} className="mr-1" />
                    {tag.name}
                  </button>
                );
              })
            )}
          </div>
          <button
            className="btn btn-ghost btn-sm ml-4"
            onClick={() => setIsTagsModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Notes Grid */}
          <div className="bg-base-300 rounded-lg p-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedFolder ? selectedFolder.name : "All Notes"}
              </h2>
              <button className="btn btn-primary" onClick={createEmptyNote}>
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Add keys to loading placeholders
                [...Array(6)].map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="bg-base-200 rounded-lg p-4 animate-pulse"
                  >
                    <div className="h-4 bg-base-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-base-100 rounded w-1/2"></div>
                  </div>
                ))
              ) : filteredNotes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No notes found</p>
                  <p className="text-sm mb-4">
                    {selectedFolder
                      ? "This folder is empty"
                      : selectedTags.length > 0
                      ? "No notes match the selected tags"
                      : "Start by creating your first note"}
                  </p>
                  <button
                    onClick={createEmptyNote}
                    className="btn btn-primary btn-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Create Note
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={`note-${note._id}`} // Add prefix
                    className="bg-base-200 rounded-lg p-4 cursor-pointer hover:bg-base-100"
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">
                        {note.title || "Untitled"}
                      </h3>
                      {note.isPinned && (
                        <FontAwesomeIcon
                          icon={faThumbtack}
                          className="text-primary"
                        />
                      )}
                    </div>
                    {/* <p className="text-sm text-gray-400 line-clamp-3">
                      {note.content}
                    </p> */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(note.tags || []).map((tagId) => {
                        // Add null check
                        const tag = tags.find((t) => t._id === tagId);
                        return tag ? (
                          <span
                            key={`note-${note._id}-tag-${tagId}`} // Add compound key
                            className={`badge badge-sm ${getContrastText(
                              tag.color
                            )}`}
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNewFolderModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                placeholder="Folder name"
                className="input input-bordered w-full mt-4"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsNewFolderModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Updated Tags Management Modal */}
      {isTagsModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative">
            <h3 className="font-bold text-lg">Manage Tags</h3>
            <div className="space-y-4 mt-4">
              {tags.map((tag) => (
                <div key={tag._id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tagChanges.get(tag._id)?.color || tag.color}
                    onChange={(e) =>
                      handleTagChange(tag._id, { color: e.target.value })
                    }
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tagChanges.get(tag._id)?.name || tag.name}
                    onChange={(e) =>
                      handleTagChange(tag._id, { name: e.target.value })
                    }
                    className="input input-bordered flex-1"
                  />
                  <button
                    className="btn btn-ghost btn-square"
                    onClick={() => setShowDeleteTagModal(tag._id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
              <form onSubmit={handleCreateTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag name"
                  className="input input-bordered flex-1"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Add Tag
                </button>
              </form>
            </div>

            {/* Floating Action Buttons */}
            {hasTagChanges && (
              <div className="fixed bottom-4 right-4 flex gap-2">
                <button className="btn btn-error" onClick={discardTagChanges}>
                  Discard Changes
                </button>
                <button className="btn btn-success" onClick={saveTagChanges}>
                  Save Changes
                </button>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  if (hasTagChanges) {
                    if (confirm("You have unsaved changes. Discard them?")) {
                      discardTagChanges();
                      setIsTagsModalOpen(false);
                    }
                  } else {
                    setIsTagsModalOpen(false);
                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {selectedNote && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl h-[80vh]">
            <Editor
              note={selectedNote}
              onUpdate={(updates) => updateNote(selectedNote._id, updates)}
              onDelete={() => deleteNote(selectedNote._id)}
              folders={folders}
              tags={tags}
              onClose={() => setSelectedNote(null)}
              defaultPreview={startInPreview} // Pass the preview state
            />
          </div>
        </div>
      )}

      {/* Add Edit Folder Modal */}
      {isEditFolderModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Edit Folder</h3>
            <form onSubmit={handleEditFolder}>
              <input
                type="text"
                placeholder="Folder name"
                className="input input-bordered w-full mt-4"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsEditFolderModalOpen(false);
                    setEditingFolder(null);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Delete Folder Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Folder</h3>
            <p className="py-4">
              What would you like to do with the notes in this folder?
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => deleteFolder(showDeleteModal._id, false)}
              >
                Keep Notes
              </button>
              <button
                className="btn btn-error"
                onClick={() => deleteFolder(showDeleteModal._id, true)}
              >
                Delete Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Delete Tag Confirmation Modal */}
      {showDeleteTagModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Tag</h3>
            <p className="py-4">
              Are you sure you want to delete this tag? This cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowDeleteTagModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => handleDeleteTag(showDeleteTagModal)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
