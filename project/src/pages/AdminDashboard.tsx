import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FolderPlus, Clock, CheckCircle, BarChart3, Users, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { db } from '../firebase/config';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
  createdAt: string;
}

interface Application {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  userName: string;
  projectName: string;
}

const AdminDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#f97316', '#10b981', '#ef4444', '#6b7280'];

  useEffect(() => {
    // Fetch all projects
    const projectsUnsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projectsData);
      setLoading(false);
    });

    // Fetch all applications
    const applicationsUnsubscribe = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));
      setApplications(applicationsData);
    });

    return () => {
      projectsUnsubscribe();
      applicationsUnsubscribe();
    };
  }, []);

  const getProjectStats = () => {
    const approved = projects.filter(p => p.status === 'approved').length;
    const pending = projects.filter(p => p.status === 'pending').length;
    const total = projects.length;
    
    return { total, approved, pending };
  };

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { pending, approved, rejected, total: applications.length };
  };

  const getPieChartData = () => {
    const projectStats = getProjectStats();
    return [
      { name: 'Approved', value: projectStats.approved, color: COLORS[1] },
      { name: 'Pending', value: projectStats.pending, color: COLORS[0] }
    ].filter(item => item.value > 0);
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      projects: Math.floor(Math.random() * 8) + index,
      applications: Math.floor(Math.random() * 15) + index * 2
    }));
  };

  const getRecentActivity = () => {
    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5);
    
    const recentApplications = applications
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5);

    return { recentProjects, recentApplications };
  };

  const projectStats = getProjectStats();
  const applicationStats = getApplicationStats();
  const { recentProjects, recentApplications } = getRecentActivity();

  if (loading) {
    return (
      <div className="flex">
        <Sidebar isAdmin />
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar isAdmin />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor and manage your projects and applications</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={projectStats.total}
            icon={FolderPlus}
            color="bg-blue-500"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Pending Projects"
            value={projectStats.pending}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Approved Projects"
            value={projectStats.approved}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Total Applications"
            value={applicationStats.total}
            icon={Users}
            color="bg-purple-500"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Project Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Project Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center mt-4 space-x-4">
              {getPieChartData().map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-400">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-4">
              <BarChart3 size={24} className="text-orange-500 mr-3" />
              <h3 className="text-xl font-semibold text-white">Monthly Overview</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="projects" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recent Projects</h3>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{project.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'approved' ? 'bg-green-500 text-white' :
                      project.status === 'pending' ? 'bg-yellow-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{project.description}</p>
                  <div className="text-xs text-gray-500">
                    Budget: ${project.budget?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recent Applications</h3>
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">{application.userName}</h4>
                      <p className="text-sm text-gray-400">{application.projectName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      application.status === 'approved' ? 'bg-green-500 text-white' :
                      application.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {application.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;