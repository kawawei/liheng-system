import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  DollarSign,
  Search,
  LogOut,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  Activity,
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  Menu,
  Phone,
  MapPin,
  Share2,
  Camera,
  AtSign,
  Trash2,
  Pencil,
  Save,
  UserCog,
  Shield,
  BookOpen,
  Bug,
  Ticket,
  Video,
  Image as ImageIcon,
  Paperclip,
  LucideIcon
} from 'lucide-react';

/**
 * @file TextIcon.tsx
 * @description 統一圖標組件 / Unified Text Icon Component
 * @description_en Strictly adheres to No-Emoji specification with standard sizes (sm:16, md:20, lg:24)
 * @description_zh 嚴格遵循完全禁用 Emoji 之規範，提供 sm(16px)、md(20px)、lg(24px) 標準尺寸圖標
 */

export type IconName =
  | 'dashboard'
  | 'users'
  | 'contracts'
  | 'projects'
  | 'finance'
  | 'search'
  | 'logout'
  | 'plus'
  | 'success'
  | 'warning'
  | 'danger'
  | 'clock'
  | 'send'
  | 'message'
  | 'file-check'
  | 'building'
  | 'calendar'
  | 'layers'
  | 'activity'
  | 'login'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'lock'
  | 'arrow-right'
  | 'arrow-left'
  | 'user'
  | 'user-cog'
  | 'shield'
  | 'menu'
  | 'phone'
  | 'map-pin'
  | 'fb'
  | 'ig'
  | 'threads'
  | 'trash'
  | 'edit'
  | 'save'
  | 'book'
  | 'knowledge'
  | 'bug'
  | 'ticket'
  | 'video'
  | 'image'
  | 'attachment';

export type IconSize = 'sm' | 'md' | 'lg';

interface TextIconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

const iconMap: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  contracts: FileText,
  projects: FolderKanban,
  finance: DollarSign,
  search: Search,
  logout: LogOut,
  plus: Plus,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  clock: Clock,
  send: Send,
  message: MessageSquare,
  'file-check': FileCheck,
  building: Building2,
  calendar: Calendar,
  layers: Layers,
  activity: Activity,
  login: LogIn,
  eye: Eye,
  'eye-off': EyeOff,
  mail: Mail,
  lock: Lock,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  user: User,
  'user-cog': UserCog,
  shield: Shield,
  book: BookOpen,
  knowledge: BookOpen,
  menu: Menu,
  phone: Phone,
  'map-pin': MapPin,
  fb: Share2,
  ig: Camera,
  threads: AtSign,
  trash: Trash2,
  edit: Pencil,
  save: Save,
  bug: Bug,
  ticket: Ticket,
  video: Video,
  image: ImageIcon,
  attachment: Paperclip
};

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24
};

export const TextIcon: React.FC<TextIconProps> = ({
  name,
  size = 'md',
  className = '',
  color,
  style
}) => {
  const IconComponent = iconMap[name] || Activity;
  const pixelSize = sizeMap[size];

  return (
    <IconComponent
      size={pixelSize}
      className={className}
      color={color}
      style={{ verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    />
  );
};
