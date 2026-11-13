import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { StudentProvider } from './context/StudentContext';
import { OnlineCourses, OnlineCourseLanding } from './pages/lms/OnlineCourses';
import { Batches, BatchLanding } from './pages/lms/Batches';
import { Webinars, WebinarLanding } from './pages/lms/Webinars';
import { StudentLogin, StudentRegister } from './pages/student/Auth';
import StudentDashboard from './pages/student/Dashboard';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Courses, CourseDetail } from './pages/Courses';
import { Products, ProductDetail } from './pages/Products';
import { Services, PortfolioPage, Testimonials, About, Contact } from './pages/Misc';
import NotFound from './pages/NotFound';
import { Loader } from './components/ui';

// Admin code is split into its own chunk so public visitors never download it
const admin = () => import('./admin/AdminPages');
const AdminLogin = lazy(() => admin().then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => admin().then((m) => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => admin().then((m) => ({ default: m.Dashboard })));
const Enquiries = lazy(() => admin().then((m) => ({ default: m.Enquiries })));
const SiteSettings = lazy(() => admin().then((m) => ({ default: m.SiteSettings })));
const Account = lazy(() => admin().then((m) => ({ default: m.Account })));
const ResourceManager = lazy(() => import('./admin/ResourceManager'));
const lms = () => import('./admin/LmsAdmin');
const BatchManage = lazy(() => lms().then((m) => ({ default: m.BatchManage })));
const WebinarRegistrations = lazy(() => lms().then((m) => ({ default: m.WebinarRegistrations })));
const Students = lazy(() => lms().then((m) => ({ default: m.Students })));
const Orders = lazy(() => lms().then((m) => ({ default: m.Orders })));
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const Certificate = lazy(() => import('./pages/student/Certificate'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
        <StudentProvider>
          <Toaster position="top-center" />
          <Suspense fallback={<Loader className="min-h-screen items-center" />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:slug" element={<CourseDetail />} />
              <Route path="software" element={<Products />} />
              <Route path="software/:slug" element={<ProductDetail />} />
              <Route path="services" element={<Services />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="learn" element={<OnlineCourses />} />
              <Route path="learn/:slug" element={<OnlineCourseLanding />} />
              <Route path="batches" element={<Batches />} />
              <Route path="batches/:slug" element={<BatchLanding />} />
              <Route path="webinars" element={<Webinars />} />
              <Route path="webinars/:slug" element={<WebinarLanding />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="login" element={<StudentLogin />} />
            <Route path="register" element={<StudentRegister />} />
            <Route path="learn/:slug/watch" element={<CoursePlayer />} />
            <Route path="certificate/:id" element={<Certificate />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="r/:resource" element={<ResourceManager />} />
              <Route path="settings" element={<SiteSettings />} />
              <Route path="account" element={<Account />} />
              <Route path="batches/:id" element={<BatchManage />} />
              <Route path="webinars/:id" element={<WebinarRegistrations />} />
              <Route path="students" element={<Students />} />
              <Route path="orders" element={<Orders />} />
            </Route>
          </Routes>
          </Suspense>
        </StudentProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>
);
