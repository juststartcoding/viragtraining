import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaRegCircle, FaChevronLeft, FaChevronRight, FaPlayCircle, FaFileAlt, FaFilePdf, FaCertificate, FaBars, FaTimes, FaDownload } from 'react-icons/fa';
import { api, assetUrl, errMsg } from '../../lib/api';
import { fmtMins } from '../../lib/format';
import { useStudent } from '../../context/StudentContext';
import { Seo, Loader } from '../../components/ui';
import { VideoPlayer } from '../../components/lms';
import { Logo } from '../../components/Layout';

const ICON = { video: FaPlayCircle, article: FaFileAlt, pdf: FaFilePdf };

export default function CoursePlayer() {
  const { slug } = useParams();
  const { student, checking } = useStudent();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [done, setDone] = useState(new Set());
  const [completedAt, setCompletedAt] = useState(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!student) return;
    api
      .get(`/student/courses/${slug}`)
      .then(({ data }) => {
        setData(data);
        setDone(new Set(data.progress.completedLessons));
        setCompletedAt(data.progress.completedAt);
        const all = data.course.sections.flatMap((s) => s.lessons);
        setCurrent(all.find((l) => l._id === data.progress.lastLesson)?._id || all.find((l) => !data.progress.completedLessons.includes(l._id))?._id || all[0]?._id);
      })
      .catch((e) => setError({ status: e.response?.status, message: errMsg(e) }));
  }, [slug, student]);

  const lessons = useMemo(() => (data ? data.course.sections.flatMap((s) => s.lessons) : []), [data]);
  const idx = lessons.findIndex((l) => l._id === current);
  const lesson = lessons[idx];

  if (checking) return <Loader className="min-h-screen items-center" />;
  if (!student) return <Navigate to={`/login?next=/learn/${slug}/watch`} replace />;
  if (error?.status === 403) return <Navigate to={`/learn/${slug}`} replace />;
  if (error) return <div className="p-10 text-center text-red-600">{error.message}</div>;
  if (!data) return <Loader className="min-h-screen items-center" />;

  const { course, progress } = data;
  const pct = lessons.length ? Math.round((done.size / lessons.length) * 100) : 0;

  const mark = async (lessonId, completed) => {
    try {
      const { data: r } = await api.post(`/student/courses/${course._id}/progress`, { lessonId, completed });
      setDone(new Set(r.completedLessons));
      if (r.completedAt && !completedAt) {
        setCompletedAt(r.completedAt);
        toast.success('🎉 Congratulations! You completed the course.');
      }
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const open = (id) => {
    setCurrent(id);
    setMenu(false);
    api.post(`/student/courses/${course._id}/progress`, { lessonId: id }).catch(() => {}); // remember last lesson
  };
  const completeAndNext = async () => {
    if (!done.has(lesson._id)) await mark(lesson._id, true);
    if (lessons[idx + 1]) open(lessons[idx + 1]._id);
  };

  const Sidebar = (
    <aside className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="text-sm font-bold text-slate-900">Course content</div>
        <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{done.size}/{lessons.length} completed</span><b className="text-slate-800">{pct}%</b></div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
        {completedAt && course.certificate && (
          <Link to={`/certificate/${progress.enrollmentId}`} className="btn btn-sm mt-4 w-full bg-amber-50 text-amber-700 hover:bg-amber-100"><FaCertificate /> View certificate</Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {course.sections.map((s, si) => (
          <div key={s._id}>
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">Section {si + 1}: {s.title}</div>
            {s.lessons.map((l) => {
              const I = ICON[l.type] || FaPlayCircle;
              const active = l._id === current;
              return (
                <div key={l._id} className={`flex items-start gap-3 border-b border-slate-50 px-5 py-3 text-sm ${active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                  <button onClick={() => mark(l._id, !done.has(l._id))} className="mt-0.5 text-lg" aria-label="Toggle complete">
                    {done.has(l._id) ? <FaCheckCircle className="text-emerald-500" /> : <FaRegCircle className="text-slate-300" />}
                  </button>
                  <button onClick={() => open(l._id)} className="flex-1 text-left">
                    <div className={`${active ? 'font-semibold text-brand-700' : 'text-slate-700'}`}>{l.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400"><I /> {l.duration > 0 ? fmtMins(l.duration) : l.type}</div>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <Seo title={`${lesson?.title || 'Learn'} – ${course.title}`} />
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 text-white">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/dashboard" className="hidden sm:block"><Logo light /></Link>
          <span className="hidden h-6 w-px bg-white/20 sm:block" />
          <div className="truncate text-sm font-semibold">{course.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="btn btn-ghost-light btn-sm hidden sm:inline-flex">Dashboard</Link>
          <button className="rounded-lg p-2 text-xl lg:hidden" onClick={() => setMenu(!menu)} aria-label="Course content">{menu ? <FaTimes /> : <FaBars />}</button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {lesson ? (
            <>
              <div className="bg-slate-950 px-0 pb-0 md:px-8 md:pb-8">
                <div className="mx-auto max-w-5xl">
                  {lesson.type === 'video' ? (
                    <VideoPlayer url={lesson.videoUrl} title={lesson.title} />
                  ) : lesson.type === 'pdf' && lesson.resourceUrl ? (
                    <iframe src={assetUrl(lesson.resourceUrl)} title={lesson.title} className="h-[75vh] w-full rounded-2xl bg-white" />
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              </div>
              <div className="mx-auto max-w-5xl p-5 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">Lesson {idx + 1} of {lessons.length}</div>
                    <h1 className="mt-1 text-2xl">{lesson.title}</h1>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={idx <= 0} onClick={() => open(lessons[idx - 1]._id)} className="btn btn-outline btn-sm"><FaChevronLeft /> Prev</button>
                    <button onClick={completeAndNext} className="btn btn-primary btn-sm">
                      {done.has(lesson._id) ? (lessons[idx + 1] ? 'Next' : 'Completed') : lessons[idx + 1] ? 'Mark complete & next' : 'Mark complete'} <FaChevronRight />
                    </button>
                  </div>
                </div>
                {lesson.content && <div className="card prose-text mt-6 p-6">{lesson.content}</div>}
                {lesson.resourceUrl && (
                  <a href={assetUrl(lesson.resourceUrl)} target="_blank" rel="noreferrer" className="btn btn-outline mt-6"><FaDownload /> Download resource</a>
                )}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-slate-500">This course has no lessons yet.</div>
          )}
        </main>
        <div className="hidden w-96 shrink-0 border-l border-slate-200 lg:block">{Sidebar}</div>
        {menu && <div className="absolute inset-y-0 right-0 z-20 w-full max-w-sm shadow-2xl lg:hidden">{Sidebar}</div>}
      </div>
    </div>
  );
}
