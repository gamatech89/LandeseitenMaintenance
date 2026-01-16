import { Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/stores/theme';

const { Text } = Typography;

export function GlassStatCard({
  title,
  value,
  icon,
  color,
  trend,
  trendValue,
  suffix,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  suffix?: string;
  onClick?: () => void;
}) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderRadius: 16,
        border: 'none',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(107, 33, 168, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(107, 33, 168, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: isDark 
          ? '0 4px 24px rgba(0, 0, 0, 0.2)'
          : '0 4px 24px rgba(107, 33, 168, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        height: '100%',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: 13, 
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Text>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            lineHeight: 1.2,
            marginTop: 8,
            color: isDark ? '#fff' : '#1F1A23',
          }}>
            {value}
            {suffix && <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4, opacity: 0.7 }}>{suffix}</span>}
          </div>
          {trend && trendValue && (
            <div style={{ 
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8',
            }}>
              {trend === 'up' && <ArrowUpOutlined />}
              {trend === 'down' && <ArrowDownOutlined />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
