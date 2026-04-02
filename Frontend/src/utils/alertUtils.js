import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function getTimeSince(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function getSeverityColors(severity) {
  switch (severity) {
    case 'high':
      return {
        border: 'border-red-500',
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        icon: 'text-red-500'
      };
    case 'medium':
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-950/40',
        text: 'text-yellow-400',
        icon: 'text-yellow-500'
      };
    default:
      return {
        border: 'border-white/20',
        bg: 'bg-white/[0.04]',
        text: 'text-white/60',
        icon: 'text-white/40'
      };
  }
}

export function getIcon(iconType) {
  switch (iconType) {
    case 'warning':
      return AlertTriangle;
    case 'success':
      return CheckCircle;
    default:
      return Info;
  }
}