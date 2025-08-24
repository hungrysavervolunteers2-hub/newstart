import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
}

interface Application {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  projectName?: string;
}

const UserDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const COLORS = ['#f97316', '#10b981', '#ef4444', '#6b7280'];

  useEffect(() => {
    if (!userProfile) return;

    // Fetch approved projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where('status', '==', 'approved')
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projectsData);
      setLoading(false);
    });

    // Fetch user applications
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('userId', '==', userProfile.id)
    );

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));
      setApplications(applicationsData);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeApplications();
    };
  }, [userProfile]);

  const handleApplyToProject = async (projectId: string) => {
    if (!userProfile) return;

    try {
      const project = projects.find(p => p.id === projectId);
      await addDoc(collection(db, 'applications'), {
        projectId,
        userId: userProfile.id,
        userEmail: userProfile.email,
        userName: userProfile.name,
        projectName: project?.name || 'Unknown Project',
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error applying to project:', error);
    }
  };

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { pending, approved, rejected, total: applications.length };
  };

  const getPieChartData = () => {
    const stats = getApplicationStats();
    return [
      { name: 'Pending', value: stats.pending, color: COLORS[0] },
      { name: 'Approved', value: stats.approved, color: COLORS[1] },
      { name: 'Rejected', value: stats.rejected, color: COLORS[2] }
    ].filter(item => item.value > 0);
  };

  const getTimelineData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      applications: Math.floor(Math.random() * 10) + index * 2
    }));
  };

  const stats = getApplicationStats();
  const appliedProjectIds = new Set(applications.map(app => app.projectId));

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userProfile?.name}! 👋
          </h1>
          <p className="text-gray-400">Here's what's happening with your projects and applications</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={FileText}
            color="bg-orange-500"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="bg-red-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Application Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Application Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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

          {/* Applications Over Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-4">
              <TrendingUp size={24} className="text-orange-500 mr-3" />
              <h3 className="text-xl font-semibold text-white">Applications Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTimelineData()}>
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
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Available Projects and My Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Available Projects</h3>
            <p className="text-gray-400 text-sm mb-6">Browse and apply to open projects</p>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{project.name}</h4>
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      React
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Deadline: {new Date(project.endDate).toLocaleDateString()}
                    </span>
                    {!appliedProjectIds.has(project.id) ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApplyToProject(project.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded text-sm transition-colors"
                      >
                        Apply Now
                      </motion.button>
                    ) : (
                      <span className="text-green-400 text-sm">Applied ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* My Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">My Applications</h3>
            <p className="text-gray-400 text-sm mb-6">Track your applications</p>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {applications.slice(0, 3).map((application) => (
                <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{application.projectName}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      application.status === 'approved' ? 'bg-green-500 text-white' :
                      application.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {application.status === 'approved' ? 'APPROVED' :
                       application.status === 'rejected' ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="text-sm text-gray-400">
                      Role: Full Stack Developer
                    </div>
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

export default UserDashboard;