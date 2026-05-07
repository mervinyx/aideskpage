import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PublicPortfolio = () => {
  const { slug } = useParams();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPublicProject = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/portfolio/p/${slug}/`);
        setHtml(response.data.html || '');
        document.title = response.data.title || 'Published Page';
      } catch {
        setError('页面不存在或尚未发布');
        document.title = '页面不存在';
      } finally {
        setLoading(false);
      }
    };
    loadPublicProject();
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">加载中...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">{error}</div>;
  }

  return (
    <iframe
      title="Published HTML"
      srcDoc={html}
      sandbox="allow-scripts"
      className="h-screen w-full border-0"
    />
  );
};

export default PublicPortfolio;
