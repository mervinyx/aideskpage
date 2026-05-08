import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Lock, User } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

const BRAND_NAME = '喜播AI网页发布';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login/', {
        username: formData.username.trim(),
        password: formData.password,
      });
      const { access, refresh, user } = response.data;
      login({ access, refresh, user });
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex h-11 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              {BRAND_NAME}
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              上传 HTML，一键发布为可访问网页
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              使用账号和密码登录，不依赖邮箱验证码或第三方账号。登录后即可管理你的内部网页项目。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
                <Lock size={22} />
              </div>
              <h2 className="text-xl font-semibold">账号密码登录</h2>
              <p className="mt-1 text-sm text-slate-500">请输入管理员分配或注册创建的账号。</p>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {location.state?.message && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {location.state.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">账号</label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
                    placeholder="请输入账号"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">密码</label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? '登录中...' : '登录并进入项目'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
              没有账号？
              <Link to="/register" className="ml-1 font-medium text-slate-900 hover:underline">
                创建账号
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
