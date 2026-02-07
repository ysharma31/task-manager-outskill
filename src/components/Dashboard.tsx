import React, { useState, useEffect } from 'react';
import { signOut, supabase } from '../lib/supabase';
import { getTasks, createTask, updateTask, deleteTask, Task, TaskCategory } from '../lib/tasks';
import { getSubtasks, createSubtask, generateSubtasks, Subtask } from '../lib/subtasks';
import { CheckCircle, Clock, Play, Trash2, Plus, Sparkles, Save, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { smartSearch, SearchResult } from '../lib/search';

interface DashboardProps {
  onLogout: () => void;
  onProfile: () => void;
}

function Dashboard({ onLogout, onProfile }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<{ [taskId: string]: Subtask[] }>({});
  const [expandedTasks, setExpandedTasks] = useState<{ [taskId: string]: boolean }>({});
  const [generatedSuggestions, setGeneratedSuggestions] = useState<{ [taskId: string]: string[] }>({});
  const [generatingSubtasks, setGeneratingSubtasks] = useState<{ [taskId: string]: boolean }>({});
  const [savingSubtasks, setSavingSubtasks] = useState<{ [suggestionId: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('personal');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Load subtasks for all tasks
    tasks.forEach(task => {
      loadSubtasks(task.id);
    });
  }, [tasks]);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await getTasks();
    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const loadSubtasks = async (taskId: string) => {
    const { data, error } = await getSubtasks(taskId);
    if (error) {
      console.error('Error loading subtasks:', error);
    } else {
      setSubtasks(prev => ({
        ...prev,
        [taskId]: data || []
      }));
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setAddingTask(true);
    const { data, error } = await createTask({
      title: newTask.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'pending'
    });

    if (error) {
      console.error('Error creating task:', error);
    } else if (data) {
      setTasks([data, ...tasks]);
      setNewTask('');
      setNewCategory('personal');
      setNewPriority('medium');
    }
    setAddingTask(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'done') => {
    const { data, error } = await updateTask(taskId, { status: newStatus });
    if (error) {
      console.error('Error updating task:', error);
    } else if (data) {
      setTasks(tasks.map(task => task.id === taskId ? data : task));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await deleteTask(taskId);
    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleGenerateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingSubtasks(prev => ({ ...prev, [taskId]: true }));
    
    const { data, error } = await generateSubtasks(taskTitle);
    
    if (error) {
      console.error('Error generating subtasks:', error);
      if (error.error && error.error.includes('OpenAI API key')) {
        alert('AI service is not configured. Please contact the administrator to set up the OpenAI API key.');
      } else {
        alert('Failed to generate subtasks. Please try again.');
      }
    } else if (data) {
      setGeneratedSuggestions(prev => ({
        ...prev,
        [taskId]: data
      }));
      setExpandedTasks(prev => ({ ...prev, [taskId]: true }));
    }
    
    setGeneratingSubtasks(prev => ({ ...prev, [taskId]: false }));
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    const { data, error } = await smartSearch(searchQuery.trim());
    
    if (error) {
      console.error('Error performing smart search:', error);
      alert('Search failed. Please try again.');
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
    
    setSearching(false);
  };

  const handleGenerateEmbeddings = async () => {
    setGeneratingEmbeddings(true);
    
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-task-embeddings`;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in to generate embeddings');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error generating embeddings:', errorData);
        alert('Failed to generate embeddings. Please try again.');
        return;
      }

      const result = await response.json();
      alert(`Successfully generated embeddings for ${result.updated} tasks!`);
      
    } catch (error) {
      console.error('Error generating embeddings:', error);
      alert('Failed to generate embeddings. Please try again.');
    } finally {
      setGeneratingEmbeddings(false);
    }
  };

  const handleSaveSubtask = async (taskId: string, subtaskTitle: string, suggestionIndex: number) => {
    const suggestionId = `${taskId}-${suggestionIndex}`;
    setSavingSubtasks(prev => ({ ...prev, [suggestionId]: true }));
    
    const { data, error } = await createSubtask({
      title: subtaskTitle,
      parent_task_id: taskId
    });
    
    if (error) {
      console.error('Error saving subtask:', error);
      alert('Failed to save subtask. Please try again.');
    } else if (data) {
      // Update subtasks list
      setSubtasks(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), data]
      }));
      
      // Remove the suggestion from the list
      setGeneratedSuggestions(prev => ({
        ...prev,
        [taskId]: prev[taskId]?.filter((_, index) => index !== suggestionIndex) || []
      }));
    }
    
    setSavingSubtasks(prev => ({ ...prev, [suggestionId]: false }));
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Play className="w-5 h-5 text-blue-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'text-red-700 bg-red-50 border-red-200';
      case 'groceries': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'household': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'children': return 'text-pink-700 bg-pink-50 border-pink-200';
      case 'work': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'personal': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'other': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex items-center justify-center">
        <div className="text-teal-900 text-xl font-display">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-300 p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-teal-400 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-amber-400 rounded-full opacity-20 blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-display font-bold text-teal-900 mb-12 text-center">
          Your Tasks
        </h1>

        {/* Smart Search */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-display font-bold text-teal-800 mb-6">Smart Search</h2>

          {/* Generate Embeddings Button */}
          <div className="mb-6">
            <button
              onClick={handleGenerateEmbeddings}
              disabled={generatingEmbeddings}
              className="bg-teal-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingEmbeddings ? 'Generating Embeddings...' : 'Generate Embeddings for Existing Tasks'}
            </button>
            <p className="text-sm text-teal-700 mt-2">
              Click this button once to enable search for your existing tasks
            </p>
          </div>

          <form onSubmit={handleSmartSearch} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900 placeholder-gray-400"
                placeholder="Search your tasks using natural language..."
                disabled={searching}
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="bg-amber-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={result.id} className="bg-teal-50 border border-teal-200 rounded-xl p-4 hover:bg-teal-100 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-teal-700 mr-3">
                            {index + 1}.
                          </span>
                          <h4 className="text-teal-900 font-medium flex-1">{result.title}</h4>
                          <span className="text-sm text-teal-600 ml-4">
                            {Math.round(result.similarity * 100)}% match
                          </span>
                        </div>
                        <div className="flex gap-2 ml-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(result.category)}`}>
                            {getCategoryLabel(result.category)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(result.priority)}`}>
                            {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(result.status)}`}>
                            {getStatusIcon(result.status)}
                            <span className="ml-1">
                              {result.status === 'in_progress' ? 'In Progress' : result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchQuery && !searching && searchResults.length === 0 && (
            <div className="mt-6 text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No similar tasks found. Try a different search term.</p>
            </div>
          )}
        </div>
        {/* Add New Task Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-display font-bold text-teal-800 mb-6">Add New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="newTask" className="block text-sm font-semibold text-teal-900 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  id="newTask"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900 placeholder-gray-400"
                  placeholder="Enter a new task"
                  disabled={addingTask}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-teal-900 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900"
                  disabled={addingTask}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="medical">Medical</option>
                  <option value="groceries">Groceries</option>
                  <option value="household">Household</option>
                  <option value="children">Children</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-teal-900 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors duration-200 text-teal-900"
                  disabled={addingTask}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={addingTask || !newTask.trim()}
              className="w-full md:w-auto bg-amber-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              {addingTask ? 'Adding Task...' : 'Add Task'}
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-display font-bold text-teal-800 mb-6">Your Tasks ({tasks.length})</h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="font-semibold text-teal-700 mr-3 text-lg">
                          {index + 1}.
                        </span>
                        <h3 className="text-lg font-medium text-teal-900 flex-1">{task.title}</h3>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-4"
                          title="Delete task"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(task.category)}`}>
                          {getCategoryLabel(task.category)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-2">
                            {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusChange(task.id, 'pending')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            task.status === 'pending' 
                              ? 'bg-gray-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            task.status === 'in_progress' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange(task.id, 'done')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            task.status === 'done' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Done
                        </button>
                      </div>

                      {/* Generate Subtasks with AI Section */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleGenerateSubtasks(task.id, task.title)}
                          disabled={generatingSubtasks[task.id]}
                          className="flex items-center px-4 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-4"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {generatingSubtasks[task.id] ? 'Generating...' : 'Generate Subtasks with AI'}
                        </button>

                        {/* Display existing subtasks */}
                        {subtasks[task.id]?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Subtasks:</h4>
                            <div className="space-y-2">
                              {subtasks[task.id].map((subtask) => (
                                <div key={subtask.id} className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                                  <span>{subtask.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Display AI suggestions */}
                        {generatedSuggestions[task.id]?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions:</h4>
                            <div className="space-y-2">
                              {generatedSuggestions[task.id].map((suggestion, suggestionIndex) => (
                                <div key={suggestionIndex} className="flex items-center justify-between bg-amber-50 rounded-xl p-3 border border-amber-200">
                                  <span className="text-sm text-teal-900 flex-1 mr-3">{suggestion}</span>
                                  <button
                                    onClick={() => handleSaveSubtask(task.id, suggestion, suggestionIndex)}
                                    disabled={savingSubtasks[`${task.id}-${suggestionIndex}`]}
                                    className="flex items-center px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    {savingSubtasks[`${task.id}-${suggestionIndex}`] ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={onProfile}
            className="bg-teal-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-teal-700 mr-4"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="bg-white text-teal-700 font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-teal-50 border-2 border-teal-200 hover:border-teal-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;