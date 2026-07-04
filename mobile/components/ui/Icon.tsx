/**
 * Icon.tsx — Thin wrapper around lucide-react-native.
 * Enforces: strokeWidth 1.75, default size 20, default color parchmentDim.
 * Never mix icons and emoji — always use this wrapper.
 */
import React from "react";
import { Colors } from "@/constants/theme";

// Re-export every icon used in HireCompass
export {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  TrendingUp,
  Settings,
  Plus,
  Send,
  LineChart,
  AlertTriangle,
  Bell,
  Inbox,
  Eye,
  EyeOff,
  X,
  Mail,
  FileEdit,
  RefreshCw,
  MapPin,
  Globe,
  Link,
  Clock,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  DollarSign,
  Wifi,
  WifiOff,
  BookOpen,
  Zap,
  User,
  LogOut,
  Download,
  Upload,
  Star,
  Target,
  BarChart2,
  Phone,
  AtSign,
  Clipboard,
  Tag,
} from "lucide-react-native";

import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  TrendingUp,
  Settings,
  Plus,
  Send,
  LineChart,
  AlertTriangle,
  Bell,
  Inbox,
  Eye,
  EyeOff,
  X,
  Mail,
  FileEdit,
  RefreshCw,
  MapPin,
  Globe,
  Link,
  Clock,
  Pencil,
  Trash2,
  ChevronRight,
  LucideIcon,
} from "lucide-react-native";

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Standardized icon component.
 * Usage: <Icon icon={Briefcase} size={24} color={Colors.brass} />
 */
export function Icon({
  icon: LucideIconComponent,
  size = 20,
  color = Colors.parchmentDim,
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <LucideIconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}
