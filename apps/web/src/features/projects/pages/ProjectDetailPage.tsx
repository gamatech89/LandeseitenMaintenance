/**
 * Project Detail Page - Two-Column Layout
 * 
 * Features:
 * - Clean header with status badges + info popup for description
 * - Two-column layout: Main tabs (60%) + Sidebar (40%)
 * - No Credentials tab (security - PM shares via Vault)
 * - Quick Actions, Team, Recent Activity in sidebar
 * - Tabs: Todos, Resources, Health, Reports
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Tabs,
  Table,
  Space,
  Spin,
  App,
  Empty,
  Avatar,
  Badge,
  Popconfirm,
  Select,
  Checkbox,
  Tooltip,
  Modal,
  Divider,
  Switch,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  LoginOutlined,
  CheckSquareOutlined,
  FileOutlined,
  HistoryOutlined,
  LinkOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  EyeOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api';
import {
  getHealthStatusConfig,
  getSecurityStatusConfig,
  getPriorityConfig,
  formatDate,
  formatRelativeTime,
  formatResponseTime,
} from '@lsm/utils';
import { useThemeStore } from '@/stores/theme'
import { ProjectFormModal } from '../components/ProjectFormModal';
import { TodoFormModal } from '../components/TodoFormModal';
import { ResourceFormModal } from '../components/ResourceFormModal';
import { TodoDetailModal } from '../components/TodoDetailModal';
import { MaintenanceReportFormModal } from '../components/MaintenanceReportFormModal';
import { WordPressManagementTab } from '../components/WordPressManagementTab';
import { SupportTicketsTab } from '../components/SupportTicketsTab';
import type { Todo, MaintenanceReport, TodoPriority } from '@lsm/types';

const { Title, Text, Paragraph } = Typography;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id!, 10);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [viewingTodo, setViewingTodo] = useState<Todo | null>(null);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [viewingResource, setViewingResource] = useState<any | null>(null);
  const [editingReport, setEditingReport] = useState<MaintenanceReport | null>(null);
  const [activeTab, setActiveTab] = useState('todos');

  // Resource download handler
  const handleDownloadResource = async (resource: any) => {
    try {
      const response = await api.resources.download(resource.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.file_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('Failed to download file');
    }
  };

  // Fetch project
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.projects.get(projectId).then(r => r.data.data),
    enabled: !!projectId,
  });

  // Calculate project team (Manager + Developers)
  const projectTeam = project ? [
    ...(project.manager ? [project.manager] : []),
    ...(project.developers || [])
  ] : [];

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.projects.delete(projectId),
    onSuccess: () => {
      message.success('Project deleted');
      navigate('/projects');
    },
    onError: () => message.error('Failed to delete project'),
  });

  // Update todo mutation (for inline editing)
  const updateTodoMutation = useMutation({
    mutationFn: ({ todoId, data }: { todoId: number; data: any }) => 
      api.todos.update(todoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => message.error('Failed to update todo'),
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: (todoId: number) => api.todos.delete(todoId),
    onSuccess: () => {
      message.success('Todo deleted');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => message.error('Failed to delete todo'),
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: number) => api.resources.delete(resourceId),
    onSuccess: () => {
      message.success('Resource deleted');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => message.error('Failed to delete resource'),
  });

  // =========================================================================
  // WordPress Quick Actions (SSO Login + Maintenance Toggle)
  // =========================================================================
  const [ssoLoading, setSsoLoading] = useState(false);

  // Check RMB connection status
  const { data: rmbStatus } = useQuery({
    queryKey: ['rmb-status', projectId],
    queryFn: () => api.rmb.getStatus(projectId).then(r => (r.data as any)?.data || r.data),
    enabled: !!project?.health_check_secret,
    staleTime: 30000,
  });

  // Get recovery status (includes maintenance_mode)
  const { data: recoveryStatus, refetch: refetchRecoveryStatus } = useQuery({
    queryKey: ['rmb-recovery-status', projectId],
    queryFn: () => api.rmb.getRecoveryStatus(projectId).then(r => (r.data as any)?.data || r.data),
    enabled: !!project?.health_check_secret && rmbStatus?.connected,
    staleTime: 10000,
  });

  // SSO Login handler
  const handleSsoLogin = async () => {
    if (!project) return;
    setSsoLoading(true);
    try {
      const response = await api.rmb.generateLoginToken(projectId);
      if (response.data.success && response.data.login_url) {
        window.open(response.data.login_url, '_blank');
      } else {
        message.error('Failed to generate login token');
      }
    } catch {
      message.error('SSO login failed');
    } finally {
      setSsoLoading(false);
    }
  };

  // Maintenance mode mutations
  const enableMaintenanceMutation = useMutation({
    mutationFn: () => api.rmb.enableMaintenance(projectId),
    onSuccess: () => {
      message.success('Maintenance mode enabled');
      refetchRecoveryStatus();
    },
    onError: () => message.error('Failed to enable maintenance mode'),
  });

  const disableMaintenanceMutation = useMutation({
    mutationFn: () => api.rmb.disableMaintenance(projectId),
    onSuccess: () => {
      message.success('Maintenance mode disabled');
      refetchRecoveryStatus();
    },
    onError: () => message.error('Failed to disable maintenance mode'),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !project) {
    return <Empty description="Project not found" />;
  }

  const healthConfig = getHealthStatusConfig(project.health_status);
  const securityConfig = getSecurityStatusConfig(project.security_status);

  // Reusable table card style
  const tableCardStyle = {
    borderRadius: 8,
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    overflow: 'hidden' as const,
  };

  // Todos columns with inline CRUD
  const todoColumns = [
    {
      title: '',
      key: 'done',
      width: 40,
      render: (_: unknown, record: any) => (
        <Checkbox
          checked={record.status === 'completed'}
          onChange={(e) => {
            updateTodoMutation.mutate({
              todoId: record.id,
              data: { status: e.target.checked ? 'completed' : 'pending' },
            });
          }}
        />
      ),
    },
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <div 
          style={{ cursor: 'pointer' }}
          onClick={() => setViewingTodo(record)}
        >
          <Text delete={record.status === 'completed'} style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
            {title}
          </Text>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: TodoPriority) => {
        const config = getPriorityConfig(p);
        return <Tag color={config.color}>{p}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 115,
      render: (status: string, record: any) => (
        <Select
          size="small"
          value={status}
          style={{ width: '100%' }}
          variant="borderless"
          onChange={(value) => {
            updateTodoMutation.mutate({ todoId: record.id, data: { status: value } });
          }}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
          ]}
        />
      ),
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 110,
      render: (_: unknown, record: any) => (
        <Select
          size="small"
          value={record.assignee?.id}
          style={{ width: '100%' }}
          variant="borderless"
          placeholder="Assign"
          allowClear
          onChange={(value) => {
            updateTodoMutation.mutate({ todoId: record.id, data: { assignee_id: value } });
          }}
          options={[
            ...(project.manager ? [{ label: project.manager.name, value: project.manager.id }] : []),
            ...(project.developers?.map((d: any) => ({ label: d.name, value: d.id })) || [])
          ]}
        />
      ),
    },
    {
      title: 'Due',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 90,
      render: (d: string) => d ? formatDate(d) : <Text type="secondary">-</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: any) => (
        <Space size={4}>
          <Tooltip title="View details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewingTodo(record)}
            />
          </Tooltip>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditingTodo(record); setShowTodoModal(true); }}
          />
          <Popconfirm
            title="Delete todo?"
            onConfirm={() => deleteTodoMutation.mutate(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Resources columns
  const resourceColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setViewingResource(record)}>
          {record.is_quick_action && <RocketOutlined style={{ color: '#f59e0b' }} />}
          <Text strong>{title}</Text>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (t: string) => <Tag color={t === 'file' ? 'blue' : 'green'}>{t}</Tag>,
    },
    {
      title: 'Link',
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record: any) => {
        if (record.type === 'file') {
             return (
               <Button 
                 type="link" 
                 size="small" 
                 icon={<DownloadOutlined />} 
                 onClick={() => handleDownloadResource(record)}
                 style={{ paddingLeft: 0 }}
               >
                 Download
               </Button>
             );
        }
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> Open
          </a>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: any) => (
        <Space size={4}>
          <Tooltip title="View details">
             <Button
               type="text"
               size="small"
               icon={<EyeOutlined />}
               onClick={() => setViewingResource(record)}
             />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingResource(record);
                setShowResourceModal(true);
              }}
            />
          </Tooltip>
          <Popconfirm
             title="Delete resource?"
             onConfirm={() => deleteResourceMutation.mutate(record.id)}
             okText="Delete"
             okButtonProps={{ danger: true }}
           >
             <Button type="text" size="small" danger icon={<DeleteOutlined />} />
           </Popconfirm>
        </Space>
      ),
    },
  ];

  // Pending todos count
  const pendingTodosCount = project.todos?.filter((t: any) => t.status !== 'completed').length || 0;

  // Tab items (only Todos, Resources, Health, Reports)
  const tabItems = [
    {
      key: 'todos',
      label: <span><CheckSquareOutlined /> Todos <Badge count={pendingTodosCount} size="small" style={{ marginLeft: 6 }} /></span>,
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTodo(null); setShowTodoModal(true); }}>
              Add Todo
            </Button>
          </div>
          <div style={tableCardStyle}>
            <Table
              dataSource={project.todos || []}
              columns={todoColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'resources',
      label: <span><FileOutlined /> Resources</span>,
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowResourceModal(true)}>
              Add Resource
            </Button>
          </div>
          <div style={tableCardStyle}>
            <Table
              dataSource={project.resources || []}
              columns={resourceColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'wordpress',
      label: <span><SettingOutlined /> WordPress</span>,
      children: <WordPressManagementTab project={project} />,
    },
    {
      key: 'support',
      label: <span><CustomerServiceOutlined /> Support</span>,
      children: <SupportTicketsTab project={project} />,
    },
    {
      key: 'reports',
      label: <span><HistoryOutlined /> Reports</span>,
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingReport(null); setShowReportModal(true); }}>
              Add Report
            </Button>
          </div>
          <div style={tableCardStyle}>
            <Table
              dataSource={project.maintenance_reports || []}
              columns={[
                { 
                  title: 'Date', 
                  dataIndex: 'report_date', 
                  key: 'date', 
                  width: 120,
                  render: (d: string) => <Text strong>{formatDate(d)}</Text>
                },
                { 
                  title: 'Type', 
                  dataIndex: 'type', 
                  key: 'type', 
                  width: 100,
                  render: (t: string) => (
                    <Tag color={t === 'monthly' ? 'purple' : t === 'weekly' ? 'blue' : 'default'} style={{ textTransform: 'capitalize' }}>
                      {t}
                    </Tag>
                  )
                },
                { 
                  title: 'Time', 
                  key: 'time_spent', 
                  width: 80,
                  render: (_: unknown, record: any) => {
                    const mins = record.time_spent_minutes;
                    if (!mins) return <Text type="secondary">-</Text>;
                    const hours = Math.floor(mins / 60);
                    const minutes = mins % 60;
                    return <Text>{hours}h{minutes > 0 ? ` ${minutes}m` : ''}</Text>;
                  }
                },
                { 
                  title: 'Developer', 
                  key: 'user', 
                  width: 140,
                  render: (_: unknown, record: any) => (
                    <Space size={6}>
                      <Avatar size="small" style={{ background: '#6B21A8' }}>
                        {record.user?.name?.charAt(0) || '?'}
                      </Avatar>
                      <Text>{record.user?.name || '-'}</Text>
                    </Space>
                  )
                },
                {
                   title: 'Download',
                   key: 'actions',
                   width: 100,
                   render: (_: unknown, record: any) => (
                     <Space size={4}>
                       <Tooltip title="Download PDF">
                         <Button 
                           type="text" 
                           size="small" 
                           icon={<FilePdfOutlined style={{ color: '#EF4444' }} />}
                           onClick={async () => {
                             try {
                               // Use apiClient which has auth token
                               const response = await apiClient.get(`/maintenance-reports/${record.id}/pdf`, {
                                 responseType: 'blob',
                               });
                               const blob = new Blob([response.data], { type: 'application/pdf' });
                               const url = window.URL.createObjectURL(blob);
                               const link = document.createElement('a');
                               link.href = url;
                               link.download = `maintenance-report-${record.report_date}.pdf`;
                               document.body.appendChild(link);
                               link.click();
                               link.remove();
                               window.URL.revokeObjectURL(url);
                             } catch (e) {
                               message.error('Failed to download PDF');
                             }
                           }}
                         />
                       </Tooltip>
                       <Tooltip title="Edit">
                         <Button 
                           type="text" 
                           size="small" 
                           icon={<EditOutlined />} 
                           onClick={() => {
                             setEditingReport(record);
                             setShowReportModal(true);
                           }}
                         />
                       </Tooltip>
                       <Popconfirm
                         title="Delete this report?"
                         onConfirm={() => {
                           api.maintenanceReports.delete(projectId, record.id).then(() => {
                             message.success('Report deleted');
                             queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                           }).catch(() => message.error('Failed to delete report'));
                         }}
                         okText="Delete"
                         okButtonProps={{ danger: true }}
                       >
                         <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                       </Popconfirm>
                     </Space>
                   )
                }
              ]}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No maintenance reports yet" /> }}
            />
          </div>
        </div>
      ),
    },
  ];

  // Quick action links
  const quickActions = project.resources?.filter((r: any) => r.is_quick_action) || [];

  return (
    <div className="page-container">
      {/* Back Button */}
      <Link to="/projects" style={{ display: 'inline-block', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text">Back to Projects</Button>
      </Link>

      {/* Header */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 24,
          background: isDark ? '#1e293b' : '#fff',
          border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row justify="space-between" align="middle" gutter={[24, 24]}>
          <Col flex="1">
            <Space align="start" size={20}>
              <Avatar 
                shape="square" 
                size={64} 
                style={{ 
                  background: isDark ? '#7c3aed' : '#f3e8ff', 
                  color: isDark ? '#fff' : '#7c3aed',
                  fontSize: 28, 
                  fontWeight: 700,
                  borderRadius: 16,
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
                }}
              >
                {project.name.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ marginTop: 2 }}>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>{project.name}</Title>
                
                <Space align="center" size={16} wrap style={{ rowGap: 8 }}>
                  <Space size={6}>
                    <Tag bordered={false} color={healthConfig.color} style={{ margin: 0, fontWeight: 600, borderRadius: 20, padding: '0 10px' }}>
                      {healthConfig.label}
                    </Tag>
                    {project.security_status !== 'secure' && (
                      <Tag bordered={false} color={securityConfig.color} style={{ margin: 0, fontWeight: 600, borderRadius: 20, padding: '0 10px' }}>
                        <LockOutlined /> {securityConfig.label}
                      </Tag>
                    )}
                    {(project.tags && project.tags.length > 0) && project.tags.map((tag: any) => (
                      <Tag key={tag.id} color={tag.color || 'default'} style={{ margin: 0, borderRadius: 20 }}>
                        {tag.name}
                      </Tag>
                    ))}
                  </Space>

                  {(project.url || project.notes) && (
                     <Divider type="vertical" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', margin: 0 }} />
                  )}

                  <Space size={16}>
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#94a3b8' : '#64748b' }}>
                        <LinkOutlined /> 
                        <Text type="secondary" style={{ fontSize: 13 }}>{project.url.replace(/^https?:\/\//, '')}</Text>
                      </a>
                    )}
                    {project.notes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setShowDescriptionModal(true)}>
                        <InfoCircleOutlined style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>View Notes</Text>
                      </div>
                    )}
                  </Space>
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={12}>
              <Button size="large" icon={<EditOutlined />} onClick={() => setShowEditModal(true)}>Edit</Button>
              <Popconfirm
                title="Delete project?"
                description="This will delete all associated data."
                onConfirm={() => deleteMutation.mutate()}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button size="large" danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Two-Column Layout */}
      <Row gutter={20}>
        {/* Left: Main Content Tabs (70%) */}
        <Col xs={24} lg={17} xl={18}>
          <Card style={{ borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }} bodyStyle={{ padding: 0 }}>
            <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 16px' }} />
          </Card>
        </Col>

        {/* Right: Sidebar (30%) */}
        <Col xs={24} lg={7} xl={6}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Quick Actions */}
            <Card 
              title={<><RocketOutlined /> Quick Actions</>} 
              size="small"
              style={{ borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {/* WP Login - only show if RMB is connected */}
                {project.health_check_secret && rmbStatus?.connected && (
                  <Button 
                    block 
                    type="primary"
                    icon={<LoginOutlined />}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    onClick={handleSsoLogin}
                    loading={ssoLoading}
                  >
                    WP Login
                  </Button>
                )}
                
                {/* Maintenance Toggle - only show if RMB is connected */}
                {project.health_check_secret && rmbStatus?.connected && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: isDark ? '#94a3b8' : '#666' }}>Maintenance Mode</span>
                    <Switch
                      checked={!!recoveryStatus?.maintenance_mode}
                      loading={enableMaintenanceMutation.isPending || disableMaintenanceMutation.isPending}
                      onChange={(checked) => {
                        if (checked) {
                          enableMaintenanceMutation.mutate();
                        } else {
                          disableMaintenanceMutation.mutate();
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* WordPress Panel link (for full management) */}
                {project.health_check_secret && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <Button 
                      block 
                      type="text"
                      icon={<SettingOutlined />}
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => setActiveTab('wordpress')}
                    >
                      WordPress Panel
                    </Button>
                  </>
                )}
                
                <Divider style={{ margin: '8px 0' }} />
                <Button 
                  block 
                  icon={<GlobalOutlined />}
                  href={project.url}
                  target="_blank"
                  style={{ textAlign: 'left', justifyContent: 'flex-start', color: '#8b5cf6' }}
                >
                  Live Site
                </Button>
                <Divider style={{ margin: '8px 0' }} />
                {quickActions.length > 0 ? (
                  quickActions.map((res: any) => (
                    <Button
                      key={res.id}
                      block
                      type="text"
                      icon={res.type === 'file' ? <FileOutlined /> : <LinkOutlined />}
                      onClick={() => {
                        if (res.type === 'file') handleDownloadResource(res);
                        else window.open(res.url, '_blank');
                      }}
                      style={{ 
                        textAlign: 'left', 
                        justifyContent: 'flex-start',
                      }}
                    >
                      {res.title}
                    </Button>
                  ))
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>No quick actions</Text>
                )}
              </Space>
            </Card>

            {/* Team */}
            <Card 
              title={<><TeamOutlined /> Team</>} 
              size="small"
              style={{ borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Project Manager</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Avatar size="small" style={{ background: '#8b5cf6' }}>
                      {project.manager?.name?.charAt(0) || '?'}
                    </Avatar>
                    <Text>{project.manager?.name || 'Unassigned'}</Text>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Developers</Text>
                  <div style={{ marginTop: 4 }}>
                    {(project.developers?.length ?? 0) > 0 ? (
                      <Space wrap size={4}>
                        {project.developers?.map((dev: any) => (
                          <Tag key={dev.id} color="cyan">{dev.name}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">No developers assigned</Text>
                    )}
                  </div>
                </div>
              </Space>
            </Card>

            {/* Recent Activity (placeholder) */}
            <Card 
              title={<><ClockCircleOutlined /> Recent Activity</>} 
              size="small"
              style={{ borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Activity feed coming soon...
                </Text>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Modals */}
      <ProjectFormModal open={showEditModal} onClose={() => setShowEditModal(false)} project={project} />
      <TodoFormModal
        open={showTodoModal}
        onClose={() => {
          setShowTodoModal(false);
          setEditingTodo(null);
        }}
        projectId={projectId}
        todo={editingTodo}
        teamMembers={projectTeam}
      />
      
      <ResourceFormModal 
        open={showResourceModal} 
        onClose={() => { 
          setShowResourceModal(false); 
          setEditingResource(null); 
        }} 
        projectId={projectId} 
        resource={editingResource}
      />
      
      <MaintenanceReportFormModal
        open={showReportModal}
        onClose={() => { setShowReportModal(false); setEditingReport(null); }}
        projectId={projectId}
        report={editingReport}
      />
      
      <TodoDetailModal 
        open={!!viewingTodo} 
        onClose={() => setViewingTodo(null)} 
        todo={viewingTodo} 
        projectId={projectId}
        teamMembers={projectTeam}
        onEdit={() => { setEditingTodo(viewingTodo); setViewingTodo(null); setShowTodoModal(true); }}
      />

      {/* Resource Detail Modal */}
      <Modal
        title="Resource Details"
        open={!!viewingResource}
        onCancel={() => setViewingResource(null)}
        footer={[
          <Button key="close" onClick={() => setViewingResource(null)}>Close</Button>,
          viewingResource?.type === 'file' ? (
            <Button 
              key="download" 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownloadResource(viewingResource)}
            >
              Download
            </Button>
          ) : (
             viewingResource?.url && (
              <Button 
                key="open" 
                type="primary" 
                icon={<LinkOutlined />} 
                href={viewingResource.url}
                target="_blank"
              >
                Open Link
              </Button>
             )
          )
        ]}
      >
        {viewingResource && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>TITLE</Text>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{viewingResource.title}</div>
            </div>
            
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>TYPE</Text>
              <div><Tag color={viewingResource.type === 'file' ? 'blue' : 'green'}>{viewingResource.type}</Tag></div>
            </div>

            {viewingResource.notes && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>NOTES</Text>
                <div>{viewingResource.notes}</div>
              </div>
            )}

            {viewingResource.type === 'file' && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>FILE INFO</Text>
                <div>
                  <Space>
                    <FileOutlined /> 
                    {viewingResource.file_name}
                    {viewingResource.file_size && <Text type="secondary">({(viewingResource.file_size / 1024).toFixed(1)} KB)</Text>}
                  </Space>
                </div>
              </div>
            )}
            
            {viewingResource.type === 'link' && viewingResource.url && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>URL</Text>
                <div>
                  <a href={viewingResource.url} target="_blank" rel="noopener noreferrer">{viewingResource.url}</a>
                </div>
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* Description Modal */}
      <Modal
        title="Project Notes"
        open={showDescriptionModal}
        onCancel={() => setShowDescriptionModal(false)}
        footer={null}
        width={500}
      >
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {project.notes || 'No notes for this project.'}
        </Paragraph>
      </Modal>
    </div>
  );
}
