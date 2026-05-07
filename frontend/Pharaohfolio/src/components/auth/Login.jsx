import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

const BRAND_NAME = '喜播AI网页发布';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const sendCode = async () => {
    clearFeedback();
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/email-code/send/', { email });
      setCodeSent(true);
      setMessage('验证码已发送，请查看邮箱');
    } catch (err) {
      setError(err.response?.data?.error || '验证码发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    clearFeedback();
    if (!email.trim() || !code.trim()) {
      setError('请输入邮箱和验证码');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/email-code/verify/', { email, code });
      const { access, refresh, user } = response.data;
      login({ access, refresh, user });
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查验证码');
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
              使用邮箱验证码登录，无需用户名、密码或第三方账号。登录后即可管理你的内部网页项目。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-xl font-semibold">邮箱验证码登录</h2>
              <p className="mt-1 text-sm text-slate-500">新邮箱验证成功后会自动创建账号。</p>
            </div>

            {message && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">邮箱</label>
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      type="email"
                      value={email}
                      onChange={event => {
                        setEmail(event.target.value);
                        clearFeedback();
                      }}
                      className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-900"
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={loading}
                    className="shrink-0 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {codeSent ? '重新发送' : '获取验证码'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">验证码</label>
                <input
                  value={code}
                  onChange={event => {
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    clearFeedback();
                  }}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm tracking-[0.35em] outline-none focus:border-slate-900"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? '处理中...' : '登录并进入项目'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
