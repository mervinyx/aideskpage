import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Copy, ExternalLink, FileUp, Rocket, Save } from 'lucide-react';
import { withSandboxStorageFallback } from '../../utils/sandboxHtml';

const ProjectEditor = ({ mode = 'edit' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = mode === 'new';
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [project, setProject] = useState(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isNew) return;
    const loadProject = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/portfolio/projects/${id}/`);
        setProject(response.data);
        setTitle(response.data.title);
        setHtml(response.data.html || '');
      } catch {
        setError('项目不存在或无权访问');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, isNew]);

  const previewHtml = useMemo(() => withSandboxStorageFallback(html), [html]);

  const readLocalPreview = async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }
    setFile(selectedFile);
    const text = await selectedFile.text();
    setHtml(text);
  };

  const buildProjectPayload = () => {
    const payload = { title };
    if (file) {
      payload.html_content = html;
      payload.original_filename = file.name;
    }
    return payload;
  };

  const saveProject = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    if (!title.trim()) {
      setError('请输入项目名称');
      setSaving(false);
      return null;
    }
    if (isNew && !file) {
      setError('请选择 HTML 文件');
      setSaving(false);
      return null;
    }

    try {
      const response = isNew
        ? await axios.post('/api/portfolio/projects/', buildProjectPayload())
        : await axios.patch(`/api/portfolio/projects/${id}/`, buildProjectPayload());
      setProject(response.data);
      setHtml(response.data.html || html);
      setFile(null);
      setNotice('已保存');
      if (isNew) {
        navigate(`/projects/${response.data.id}`, { replace: true });
      }
      return response.data;
    } catch (err) {
      if (err.response?.status === 401) {
        setError('登录已过期，请重新登录后再发布');
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || '保存失败，请确认上传的是 .html 文件且小于 5MB');
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishProject = async () => {
    const saved = await saveProject();
    const target = saved || project;
    if (!target) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await axios.post(`/api/portfolio/projects/${target.id}/publish/`);
      setProject(response.data);
      setNotice('已发布');
    } catch {
      setError('发布失败');
    } finally {
      setSaving(false);
    }
  };

  const copyPublicUrl = async () => {
    if (!project?.public_url) return;
    await navigator.clipboard.writeText(project.public_url);
    setNotice('链接已复制');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 py-20 text-center text-slate-500">加载中...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/projects" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" title="返回">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{isNew ? '新建项目' : '编辑项目'}</h1>
              {project && <p className="text-sm text-slate-500">/p/{project.slug}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project?.status === 'published' && (
              <>
                <button onClick={copyPublicUrl} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  <Copy size={16} />
                  复制链接
                </button>
                <a href={`/p/${project.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  <ExternalLink size={16} />
                  打开
                </a>
              </>
            )}
            <button onClick={saveProject} disabled={saving} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60">
              <Save size={16} />
              保存草稿
            </button>
            <button onClick={publishProject} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
              <Rocket size={16} />
              {project?.status === 'published' ? '更新发布' : '发布'}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-sm font-medium text-slate-700">项目名称</label>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="例如：市场活动落地页"
            />

            <label className="mt-5 block text-sm font-medium text-slate-700">HTML 文件</label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
              <FileUp className="mb-2 text-slate-400" size={32} />
              <span className="text-sm font-medium text-slate-700">{file?.name || project?.original_filename || '选择 .html 文件'}</span>
              <span className="mt-1 text-xs text-slate-500">最大 5MB</span>
              <input
                type="file"
                accept=".html,.htm,text/html"
                className="sr-only"
                onChange={event => readLocalPreview(event.target.files?.[0])}
              />
            </label>

            {project && (
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">状态</dt>
                  <dd className="font-medium">{project.status === 'published' ? '已发布' : '草稿'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">文件大小</dt>
                  <dd>{Math.max(1, Math.round((project.file_size || 0) / 1024))} KB</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">更新时间</dt>
                  <dd className="text-right">{new Date(project.updated_at).toLocaleString()}</dd>
                </div>
              </dl>
            )}
          </div>

          {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </aside>

        <section className="min-h-[680px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          {previewHtml ? (
            <iframe title="HTML 预览" srcDoc={previewHtml} sandbox="allow-scripts" className="h-full min-h-[680px] w-full border-0" />
          ) : (
            <div className="flex min-h-[680px] items-center justify-center text-slate-400">等待上传 HTML 文件</div>
          )}
        </section>
      </section>
    </main>
  );
};

export default ProjectEditor;
