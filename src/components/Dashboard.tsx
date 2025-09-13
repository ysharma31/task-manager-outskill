import React, { useState } from 'react';

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const [tasks, setTasks] = useState([
    'Finish homework',
    'Call John',
    'Buy groceries'
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-light-blue p-4 font-open-sans">
      <div className="max-w-2xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-12 text-center drop-shadow-lg">
          Your Tasks
        </h1>

        {/* Tasks Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 mb-8">
          {/* Task List */}
          <div className="mb-8">
            <ul className="space-y-4">
              {tasks.map((task, index) => (
                <li key={index} className="flex items-center text-lg text-gray-700">
                  <span className="font-semibold text-light-blue-600 mr-3 min-w-[2rem]">
                    {index + 1}.
                  </span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add New Task Form */}
          <form onSubmit={handleAddTask} className="space-y-6">
            <div>
              <label htmlFor="newTask" className="block text-sm font-semibold text-gray-700 mb-2">
                New Task
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  id="newTask"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-light-blue-500 focus:outline-none transition-colors duration-200 text-gray-700 placeholder-gray-400"
                  placeholder="Enter a new task"
                />
                <button
                  type="submit"
                  className="bg-light-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 hover:bg-light-blue-700 whitespace-nowrap"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={onLogout}
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