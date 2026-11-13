import {
  FaJava, FaPhp, FaReact, FaPython, FaBullhorn, FaCogs, FaLaptopCode, FaProjectDiagram, FaSchool,
  FaFileInvoiceDollar, FaHospital, FaGraduationCap, FaUsers, FaShoppingCart, FaCode, FaGlobe,
  FaMobileAlt, FaDatabase, FaCloud, FaChartLine, FaPaintBrush, FaShieldAlt, FaServer, FaBoxOpen,
} from 'react-icons/fa';
import { SiCplusplus } from 'react-icons/si';

/** Icon keys selectable from the admin panel */
export const ICONS = {
  java: FaJava,
  php: FaPhp,
  react: FaReact,
  python: FaPython,
  cpp: SiCplusplus,
  marketing: FaBullhorn,
  code: FaCode,
  web: FaGlobe,
  mobile: FaMobileAlt,
  database: FaDatabase,
  cloud: FaCloud,
  cogs: FaCogs,
  software: FaLaptopCode,
  project: FaProjectDiagram,
  school: FaSchool,
  graduation: FaGraduationCap,
  invoice: FaFileInvoiceDollar,
  hospital: FaHospital,
  users: FaUsers,
  cart: FaShoppingCart,
  chart: FaChartLine,
  design: FaPaintBrush,
  security: FaShieldAlt,
  server: FaServer,
  box: FaBoxOpen,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export default function Icon({ name, className }) {
  const C = ICONS[name] || FaCode;
  return <C className={className} />;
}
