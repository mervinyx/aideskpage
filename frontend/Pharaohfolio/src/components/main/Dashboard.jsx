import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Copy, ExternalLink, Trash2, FileText, LogOut } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/portfolio/projects/');
      setProjects(response.data.results || []);
    } catch {
      setError('项目加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (projectId) => {
    if (!window.confirm('确定删除这个项目吗？')) return;
    await axios.delete(`/api/portfolio/projects/${projectId}/`);
    setProjects(projects.filter(project => project.id !== projectId));
  };

  const handleCopy = async (url) => {
    await navigator.clipboard.writeText(url);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold">内部网页发布</h1>
            <p className="text-sm text-slate-500">{user?.email || user?.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <Plus size={16} />
              新建项目
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="py-20 text-center text-slate-500">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
            <FileText className="mb-4 text-slate-400" size={44} />
            <h2 className="text-lg font-semibold">还没有项目</h2>
            <Link
              to="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <Plus size={16} />
              上传 HTML
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-slate-100 text-left text-sm text-slate-600">
                <tr>
                  <th className="w-[34%] px-4 py-3 font-medium">项目</th>
                  <th className="w-[14%] px-4 py-3 font-medium">状态</th>
                  <th className="w-[20%] px-4 py-3 font-medium">文件</th>
                  <th className="w-[18%] px-4 py-3 font-medium">更新时间</th>
                  <th className="w-[14%] px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:underline">
                        {project.title}
                      </Link>
                      <div className="mt-1 truncate text-xs text-slate-500">/p/{project.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${project.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {project.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="truncate px-4 py-4 text-slate-600">{project.original_filename}</td>
                    <td className="px-4 py-4 text-slate-600">{new Date(project.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        {project.status === 'published' && (
                          <>
                            <button onClick={() => handleCopy(project.public_url)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" title="复制链接">
                              <Copy size={16} />
                            </button>
                            <a href={`/p/${project.slug}`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" title="打开">
                              <ExternalLink size={16} />
                            </a>
                          </>
                        )}
                        <button onClick={() => handleDelete(project.id)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="删除">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default Dashboard;
