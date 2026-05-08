import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Lock, UserPlus } from 'lucide-react';

const BRAND_NAME = '喜播AI网页发布';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.username.trim() || !formData.password || !formData.password2) {
      setError('请输入账号和密码');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/register/', {
        username: formData.username.trim(),
        password: formData.password,
        password2: formData.password2,
      });
      navigate('/login', { state: { message: '账号创建成功，请登录' } });
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请稍后重试');
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
              创建账号，开始发布网页
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              注册只需要账号和密码，不再依赖邮箱验证码。创建后即可返回登录页进入项目管理。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
                <UserPlus size={22} />
              </div>
              <h2 className="text-xl font-semibold">创建账号</h2>
              <p className="mt-1 text-sm text-slate-500">账号不能包含 @，密码请妥善保存。</p>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">账号</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                  placeholder="请输入账号"
                  autoComplete="off"
                />
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
                    autoComplete="off"
                    onKeyDown={event => {
                      if (event.key === 'Enter') handleSubmit();
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">确认密码</label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
                    placeholder="请再次输入密码"
                    autoComplete="off"
                    onKeyDown={event => {
                      if (event.key === 'Enter') handleSubmit();
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? '创建中...' : '创建账号'}
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
              已有账号？
              <Link to="/login" className="ml-1 font-medium text-slate-900 hover:underline">
                去登录
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Register;
