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
  | 'activity';

export type IconSize = 'sm' | 'md' | 'lg';

interface TextIconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  color?: string;
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
  activity: Activity
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
  color
}) => {
  const IconComponent = iconMap[name] || Activity;
  const pixelSize = sizeMap[size];

  return (
    <IconComponent
      size={pixelSize}
      className={className}
      color={color}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    />
  );
};
