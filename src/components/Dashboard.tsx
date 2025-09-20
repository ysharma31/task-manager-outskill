import React, { useState, useEffect } from 'react';
import { signOut } from '../lib/supabase';
import { getTasks, createTask, updateTask, deleteTask, Task } from '../lib/tasks';
import { getSubtasks, createSubtask, generateSubtasks, Subtask } from '../lib/subtasks';
import { CheckCircle, Clock, Play, Trash2, Plus, Sparkles, Save, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [newTask, setNewTask] = useState('');
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
      priority: newPriority,
      status: 'pending'
    });

    if (error) {
      console.error('Error creating task:', error);
    } else if (data) {
      setTasks([data, ...tasks]);
      setNewTask('');
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
      alert('Failed to generate subtasks. Please try again.');
    } else if (data) {
      setGeneratedSuggestions(prev => ({
        ...prev,
        [taskId]: data
      }));
      setExpandedTasks(prev => ({ ...prev, [taskId]: true }));
    }
    
    setGeneratingSubtasks(prev => ({ ...prev, [taskId]: false }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light-blue flex items-center justify-center font-open-sans">
        <div className="text-white text-xl">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light-blue p-4 font-open-sans">
      <div className="max-w-4xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-12 text-center drop-shadow-lg">
          Your Tasks
        </h1>

        {/* Add New Task Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-light-blue-700 mb-6">Add New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="newTask" className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  id="newTask"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                  placeholder="Enter a new task"
                  disabled={addingTask}
                />
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700"
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
              className="w-full md:w-auto bg-light-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-light-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              {addingTask ? 'Adding Task...' : 'Add Task'}
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-light-blue-700 mb-6">Your Tasks ({tasks.length})</h2>
          
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
                        <span className="font-semibold text-light-blue-600 mr-3 text-lg">
                          {index + 1}.
                        </span>
                        <h3 className="text-lg font-medium text-gray-800 flex-1">{task.title}</h3>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-4"
                          title="Delete task"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
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
                          className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-4"
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
                                <div key={suggestionIndex} className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-100">
                                  <span className="text-sm text-gray-700 flex-1 mr-3">{suggestion}</span>
                                  <button
                                    onClick={() => handleSaveSubtask(task.id, suggestion, suggestionIndex)}
                                    disabled={savingSubtasks[`${task.id}-${suggestionIndex}`]}
                                    className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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

                    {/* Generate Subtasks Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => handleGenerateSubtasks(task.id, task.title)}
                          disabled={generatingSubtasks[task.id]}
                          className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {generatingSubtasks[task.id] ? 'Generating...' : 'Generate Subtasks with AI'}
                        </button>
                        
                        {(subtasks[task.id]?.length > 0 || generatedSuggestions[task.id]?.length > 0) && (
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            {expandedTasks[task.id] ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedTasks[task.id] && (
                        <div className="space-y-3">
                          {/* Existing Subtasks */}
                          {subtasks[task.id]?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks:</h4>
                              <div className="space-y-2">
                                {subtasks[task.id].map((subtask) => (
                                  <div key={subtask.id} className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    {subtask.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Suggestions */}
                          {generatedSuggestions[task.id]?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions:</h4>
                              <div className="space-y-2">
                                {generatedSuggestions[task.id].map((suggestion, suggestionIndex) => (
                                  <div key={suggestionIndex} className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                                    <span className="text-sm text-gray-700 flex-1">{suggestion}</span>
                                    <button
                                      onClick={() => handleSaveSubtask(task.id, suggestion, suggestionIndex)}
                                      disabled={savingSubtasks[`${task.id}-${suggestionIndex}`]}
                                      className="ml-3 flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      )}
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
            className="bg-light-blue-600 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-light-blue-700 mr-4"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="bg-white text-light-blue-600 font-semibold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-light-blue-50 border-2 border-transparent hover:border-light-blue-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;