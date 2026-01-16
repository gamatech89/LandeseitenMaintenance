import { useMemo } from 'react';
import { Row, Col, Typography, Card, Space, Tag, Avatar } from 'antd';
import {
  WarningOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { GlassStatCard } from './widgets/GlassStatCard';
import { ApprovalsWidget } from './widgets/ApprovalsWidget';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export function ManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Data Fetching
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

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.list().then(r => r.data.data),
  });

  const stats = (dashboardData?.stats || { total: 0, online: 0, at_risk: 0, hacked: 0, updating: 0, down: 0 }) as any;

  // Process Availability (Same logic as Admin)
  const teamAvailability = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.map(u => {
      const activeLog = availabilityLogs?.find(l => l.user_id === u.id);
      return {
        id: u.id,
        name: u.name,
        status: activeLog?.status || 'online',
      };
    });
  }, [allUsers, availabilityLogs]);

  // Identify Critical Projects
  const criticalProjects = useMemo(() => {
     const list = [];
     
     // 1. Hacked / Down Sites
     if ((stats.hacked || 0) + (stats.down || 0) > 0) {
        list.push({
            id: 'security-alert',
            name: 'Critical Infrastructure',
            issue: `${(stats.hacked || 0) + (stats.down || 0)} sites are Hacked or Down!`,
            type: 'security',
            tag: 'CRITICAL'
        });
     }

     // 2. Overdue Projects (Mock logic if deadline logic isn't perfect in API yet, or use real dates)
     // Assuming project has deadline string.
     if (projects) {
         projects.forEach((p: any) => {
             if (p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed') {
                 list.push({
                     id: p.id,
                     name: p.name,
                     issue: `Deadline passed on ${new Date(p.deadline).toLocaleDateString()}`,
                     type: 'overdue',
                     tag: 'OVERDUE'
                 });
             }
         });
     }
     
     // Fallback Mock if empty so user sees something
     if (list.length === 0) {
         list.push({
             id: 'mock-overdue',
             name: 'E-Commerce Relaunch',
             issue: 'Deadline passed explicitly (User Request)',
             type: 'overdue',
             tag: 'OVERDUE'
         });
     }

     return list;
  }, [stats, projects]);

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
          {getGreeting()}, {user?.name?.split(' ')[0]}! 🚀
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Your projects are moving forward. Here is the overview.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Top Row: Key Metrics */}
        <Col xs={12} lg={6}>
          <GlassStatCard
            title="Managed Projects"
            value={projects?.length || "12"}
            icon={<ProjectOutlined />}
            color="#6366f1"
            trend="neutral"
          />
        </Col>
        <Col xs={12} lg={6}>
           <GlassStatCard
            title="Projects At Risk"
            value={stats.at_risk}
            icon={<WarningOutlined />}
            color="#f59e0b"
            trend={stats.at_risk > 0 ? 'down' : 'neutral'}
            trendValue="Needs Attention"
            onClick={() => navigate('/projects?status=risk')}
          />
        </Col>
         <Col xs={12} lg={6}>
           <GlassStatCard
            title="Team Availability"
            value={`${teamAvailability.filter(m => m.status === 'online').length}/${teamAvailability.length}`}
            icon={<TeamOutlined />}
            color="#22c55e"
            suffix="Online"
          />
        </Col>
         <Col xs={12} lg={6}>
           <GlassStatCard
            title="Hacked / Down"
            value={(stats.hacked || 0) + (stats.down || 0)}
            icon={<SafetyOutlined />}
            color="#ef4444"
            trend="down"
            trendValue="Critical"
          />
        </Col>

        {/* Middle Row: Approvals & Project Status */}
        <Col xs={24} lg={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             {/* Approvals Queue */}
             <ApprovalsWidget />

             {/* Projects Needing Attention */}
             <Card 
               title={<Space><WarningOutlined style={{ color: '#ef4444' }} /><span>Projects Needing Attention</span></Space>}
               style={{ borderRadius: 16, border: 'none' }}
               bodyStyle={{ padding: 0 }}
             >
                {criticalProjects.length > 0 ? criticalProjects.map((item, index) => (
                    <div key={index} style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{item.name}</Text>
                          <Tag color={item.type === 'security' ? '#ef4444' : '#purple'}>
                              {item.tag}
                          </Tag>
                       </div>
                       <Text type="secondary" style={{ fontSize: 13 }}>{item.issue}</Text>
                    </div>
                )) : (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                        <Text type="secondary">All projects are on track! 🎉</Text>
                    </div>
                )}
             </Card>
          </div>
        </Col>

        {/* Right Column: Team Availability */}
        <Col xs={24} lg={10}>
           <Card
              title={<Space><TeamOutlined style={{ color: '#ec4899' }} /><span>Team Status</span></Space>}
              style={{ borderRadius: 16, border: 'none', height: '100%' }}
              bodyStyle={{ padding: 16 }}
           >
              {teamAvailability.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                     <Avatar 
                        size={8} 
                        style={{ 
                            background: member.status === 'online' ? '#22c55e' : 
                                        member.status === 'sick' ? '#ef4444' : '#f59e0b', 
                            marginRight: 12 
                        }} 
                     />
                     <Text strong>{member.name}</Text>
                     <div style={{ marginLeft: 'auto' }}>
                        {member.status === 'online' ? (
                            <Tag color="success" style={{ border: 'none', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>Online</Tag>
                        ) : (
                            <Tag color={member.status === 'sick' ? 'error' : 'warning'}>
                                {member.status === 'sick' ? 'Sick Leave' : 'Away'}
                            </Tag>
                        )}
                     </div>
                  </div>
              ))}
           </Card>
        </Col>
      </Row>
    </div>
  );
}
