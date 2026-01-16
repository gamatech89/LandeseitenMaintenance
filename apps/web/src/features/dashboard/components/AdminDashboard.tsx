import { useMemo } from 'react';
import { Row, Col, Typography, Card, Space, Tag, Avatar, Badge } from 'antd';
import {
  GlobalOutlined,
  SafetyOutlined,
  AlertOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { GlassStatCard } from './widgets/GlassStatCard';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/theme';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  
  // Fetch real dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.get().then(r => r.data.data),
  });

  const { data: availabilityLogs } = useQuery({
    queryKey: ['availability'],
    queryFn: () => api.availability.list().then(r => r.data.data),
  });

  const { data: allUsers } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.team.list().then(r => r.data.data),
  });

  const stats = (dashboardData?.stats || { total: 0, online: 0, at_risk: 0, hacked: 0, updating: 0, down: 0 }) as any;

  // Merge real data
  const teamAvailability = useMemo(() => {
    if (!allUsers) return [];
    
    return allUsers.map(u => {
      const activeLog = availabilityLogs?.find(l => l.user_id === u.id);
      
      // Calculate projects count if available in log's user relation, otherwise default to 0
      // Note: availabilityLogs[].user has the relations eagerly loaded
      const projectsCount = activeLog?.user ? 
          ((activeLog.user as any).assigned_projects?.length || 0) + ((activeLog.user as any).managed_projects?.length || 0)
          : 5; // Fallback mock for available users (or if API doesn't return count for team list)

      if (activeLog) {
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          status: activeLog.status,
          until: activeLog.end_date,
          projects_assigned: projectsCount
        };
      }
      
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        status: 'available',
        until: null,
        projects_assigned: projectsCount
      };
    });
  }, [allUsers, availabilityLogs]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
           {getGreeting()}, {user?.name?.split(' ')[0]}! 🛡️
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          System health & team availability overview.
        </Text>
      </div>

      {/* Website Health Overview (Replaces Financials) */}
      <Title level={5} style={{ marginBottom: 16 }}>Website Health Monitor</Title>
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={12} lg={6}>
          <GlassStatCard
            title="Monitoring"
            value={stats.total}
            icon={<GlobalOutlined />}
            color="#3b82f6"
            suffix="Sites"
          />
        </Col>
        <Col xs={12} lg={6}>
          <GlassStatCard
            title="Secure / Online"
            value={stats.online}
            icon={<CheckCircleOutlined />}
            color="#22c55e"
            trend="up"
            trendValue="100% Uptime" // Mock uptime
          />
        </Col>
        <Col xs={12} lg={6}>
          <GlassStatCard
            title="At Risk"
            value={stats.at_risk}
            icon={<AlertOutlined />}
            color="#f59e0b"
            suffix="Warnings"
            onClick={() => navigate('/projects?status=risk')}
          />
        </Col>
        <Col xs={12} lg={6}>
          <GlassStatCard
            title="Hacked / Down"
            value={(stats.hacked || 0) + (stats.down || 0)} // Combine critical states
            icon={<SafetyOutlined />}
            color="#ef4444"
            trend={stats.hacked > 0 ? 'down' : 'neutral'}
            trendValue={stats.hacked > 0 ? 'Critical Alert' : 'Stable'}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Team Availability Risk Monitor */}
        <Col xs={24} lg={16}>
           <Card
              title={
                <Space>
                  <MedicineBoxOutlined style={{ color: '#ec4899' }} />
                  <span>Team Availability & Impact</span>
                </Space>
              }
              style={{ borderRadius: 16, border: 'none', height: '100%' }}
              bodyStyle={{ padding: 0 }}
           >
              <div is="scroll-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '16px 24px', color: isDark ? '#94a3b8' : '#64748b' }}>Team Member</th>
                      <th style={{ textAlign: 'left', padding: '16px 24px', color: isDark ? '#94a3b8' : '#64748b' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '16px 24px', color: isDark ? '#94a3b8' : '#64748b' }}>Return Date</th>
                      <th style={{ textAlign: 'left', padding: '16px 24px', color: isDark ? '#94a3b8' : '#64748b' }}>Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamAvailability.filter(m => m.status !== 'available').map((member, index) => (
                      <tr key={index} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f8fafc' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar style={{ backgroundColor: member.status === 'sick' ? '#ef4444' : '#f59e0b' }} icon={<UserOutlined />} />
                            <div>
                              <Text strong style={{ display: 'block' }}>{member.name}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>{member.role}</Text>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {member.status === 'sick' && (
                            <Tag style={{ 
                              background: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6
                            }}>
                              Sick Leave
                            </Tag>
                          )}
                          {member.status === 'vacation' && (
                            <Tag style={{ 
                              background: '#f59e0b', 
                              color: 'white', 
                              border: 'none', 
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6
                            }}>
                              Vacation
                            </Tag>
                          )}
                          {member.status === 'parental' && (
                            <Tag style={{ 
                              background: '#8b5cf6', 
                              color: 'white', 
                              border: 'none', 
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6
                            }}>
                              Parental Leave
                            </Tag>
                          )}
                          {(member.status === 'other' || (member.status !== 'sick' && member.status !== 'vacation' && member.status !== 'parental' && member.status !== 'available')) && (
                            <Tag style={{ 
                              background: '#64748b', 
                              color: 'white', 
                              border: 'none', 
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6
                            }}>
                              {member.status === 'other' ? 'Other' : member.status}
                            </Tag>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <Space>
                             <CalendarOutlined style={{ opacity: 0.5 }} /> 
                             <Text>{member.until ? new Date(member.until).toLocaleDateString() : 'N/A'}</Text>
                          </Space>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                           {member.projects_assigned > 0 && (
                             <Tag style={{ 
                               background: 'rgba(239, 68, 68, 0.2)', 
                               color: '#fda4af', 
                               border: '1px solid #ef4444',
                               fontWeight: 500,
                               borderRadius: 12 
                             }}>
                               {member.projects_assigned} Projects Impacted
                             </Tag>
                           )}
                        </td>
                      </tr>
                    ))}
                    {teamAvailability.filter(m => m.status !== 'available').length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: 40, textAlign: 'center' }}>
                          <CheckCircleOutlined style={{ fontSize: 32, color: '#22c55e', marginBottom: 12 }} />
                          <div><Text>Full team availability!</Text></div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </Card>
        </Col>

        {/* Expenses Overview (Replaces Revenue) */}
        <Col xs={24} lg={8}>
           <Card
              title={<Space><TeamOutlined style={{ color: '#3b82f6' }} /><span>Available Team</span></Space>}
              style={{ borderRadius: 16, border: 'none', height: '100%' }}
           >
              {teamAvailability.filter(m => m.status === 'available').map((member) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                      <Text strong>{member.name}</Text>
                   </div>
                   <Badge 
                     count={member.projects_assigned} 
                     style={{ 
                       backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#6366f1',
                       color: isDark ? '#a5b4fc' : 'white',
                       boxShadow: 'none'
                     }} 
                     title="Projects Assigned" 
                   />
                </div>
              ))}
           </Card>
        </Col>
      </Row>
    </div>
  );
}
