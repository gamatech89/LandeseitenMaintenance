/**
 * Projects Page - Polished
 * 
 * Features:
 * - Stats Cards (Down, Hacked/At Risk, Monitoring, Total)
 * - Enhanced filters in single row
 * - Rich table with inline status editing
 * - PM vs Developer color distinction
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  App,
  Avatar,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FolderOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  LockOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  extractDomain,
} from '@lsm/utils';
import { ProjectFormModal } from '../components/ProjectFormModal';
import type { Project, ProjectFilters } from '@lsm/types';
import type { ColumnsType } from 'antd/es/table';
import { useThemeStore } from '@/stores/theme';

const { Title, Text } = Typography;

export function ProjectsPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useTranslation();
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<ProjectFilters>({
    page: 1,
    per_page: 15,
    search: '',
    health: 'all',
    security: 'all',
  });

  // Fetch projects
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.projects.list(filters).then(r => r.data),
  });

  // Fetch stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['projects', 'stats'],
    queryFn: () => api.projects.getStats().then(r => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['projects', 'filter-options'],
    queryFn: () => api.projects.getFilterOptions().then(r => r.data.data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Update project mutation (for inline status changes)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.projects.update(id, data),
    onSuccess: () => {
      message.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      message.error('Failed to update status');
    },
  });

  // Health/Security options for inline editing
  const healthOptions = [
    { label: '● Online', value: 'online', color: '#10b981' },
    { label: '● Down', value: 'down_error', color: '#ef4444' },
    { label: '● Updating', value: 'updating', color: '#f59e0b' },
  ];

  const securityOptions = [
    { label: '🔒 Secure', value: 'secure', color: '#10b981' },
    { label: '👁 Monitoring', value: 'monitoring', color: '#f59e0b' },
    { label: '⚠ At Risk', value: 'compromised', color: '#f97316' },
    { label: '🚨 Hacked', value: 'hacked', color: '#ef4444' },
  ];

  // Table columns - Improved spacing
  const columns: ColumnsType<Project> = [
    {
      title: 'External ID',
      dataIndex: 'project_external_id',
      key: 'external_id',
      width: 110,
      render: (id: string) => (
        <Text style={{ color: '#8b5cf6', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
          {id || '-'}
        </Text>
      ),
    },
    {
      title: 'Maint. ID',
      dataIndex: 'maintenance_id',
      key: 'maint_id',
      width: 110,
      render: (id: string) => (
        <Text style={{ color: '#ec4899', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
          {id || '-'}
        </Text>
      ),
    },
    {
      title: 'Project',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar 
            style={{ 
              background: `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)`,
              flexShrink: 0,
              fontSize: 14,
            }}
            size={32}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ display: 'block', color: isDark ? '#f8fafc' : '#1e293b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.name}
            </Text>
            {record.url && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {extractDomain(record.url)}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Team',
      key: 'team',
      width: 140,
      render: (_, record) => {
        const pm = record.manager;
        const devs = record.developers || [];
        
        if (!pm && devs.length === 0) {
          return <Text type="secondary" style={{ fontSize: 12 }}>Unassigned</Text>;
        }

        return (
          <Space size={4} wrap>
            {pm && (
              <Tooltip title={`${pm.name} (PM)`}>
                <Tag 
                  style={{ 
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 11,
                    padding: '0 8px',
                    margin: 0,
                  }}
                >
                  {pm.name.split(' ')[0][0]}{pm.name.split(' ')[1]?.[0] || ''}
                </Tag>
              </Tooltip>
            )}
            {devs.map((dev: any, idx: number) => (
              <Tooltip key={idx} title={`${dev.name} (Dev)`}>
                <Tag 
                  style={{ 
                    background: '#06b6d4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 11,
                    padding: '0 8px',
                    margin: 0,
                  }}
                >
                  {dev.name.split(' ')[0][0]}{dev.name.split(' ')[1]?.[0] || ''}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'TODOs',
      key: 'todos',
      width: 70,
      align: 'center',
      render: (_, record) => {
        const count = record.pending_todos_count || 0;
        return (
          <Badge 
            count={count} 
            style={{ 
              backgroundColor: count === 0 ? '#10b981' : count < 5 ? '#f59e0b' : '#ef4444',
              fontSize: 11,
            }}
            showZero
          />
        );
      },
    },
    {
      title: 'Tags',
      key: 'tags',
      width: 120,
      render: (_: unknown, record: Project) => {
        const projectTags = (record as any).tags || [];
        if (projectTags.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        return (
          <Space size={4} wrap>
            {projectTags.slice(0, 2).map((tag: any) => (
              <Tag key={tag.id} color={tag.color || 'default'} style={{ margin: 0, fontSize: 10 }}>
                {tag.name}
              </Tag>
            ))}
            {projectTags.length > 2 && (
              <Tooltip title={projectTags.slice(2).map((t: any) => t.name).join(', ')}>
                <Tag style={{ margin: 0, fontSize: 10 }}>+{projectTags.length - 2}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: <span style={{ color: '#10b981' }}>⚡ Health</span>,
      key: 'health',
      width: 130,
      render: (_, record) => (
          <Select
            size="small"
            value={record.health_status}
            style={{ width: '100%' }}
            variant="borderless"
            onChange={(value) => {
              updateMutation.mutate({ id: record.id, data: { health_status: value } });
            }}
            onClick={(e) => e.stopPropagation()}
            options={healthOptions.map(o => ({
              label: <span style={{ color: o.color }}>{o.label}</span>,
              value: o.value,
            }))}
            dropdownStyle={{ minWidth: 120 }}
          />
        ),
    },
    {
      title: <span style={{ color: '#f59e0b' }}>🔐 Security</span>,
      key: 'security',
      width: 140,
      render: (_, record) => (
          <Select
            size="small"
            value={record.security_status}
            style={{ width: '100%' }}
            variant="borderless"
            onChange={(value) => {
              updateMutation.mutate({ id: record.id, data: { security_status: value } });
            }}
            onClick={(e) => e.stopPropagation()}
            options={securityOptions.map(o => ({
              label: <span style={{ color: o.color }}>{o.label}</span>,
              value: o.value,
            }))}
            dropdownStyle={{ minWidth: 140 }}
          />
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${record.id}`);
          }}
          style={{ borderRadius: 8 }}
        >
          View
        </Button>
      ),
    },
  ];

  // Calculate additional stats
  const downCount = data?.data?.filter((p: Project) => p.health_status === 'down_error').length || 0;
  const hackedCount = data?.data?.filter((p: Project) => p.security_status === 'hacked').length || 0;
  const compromisedCount = data?.data?.filter((p: Project) => p.security_status === 'compromised').length || 0;
  const monitoringCount = data?.data?.filter((p: Project) => p.security_status === 'monitoring').length || 0;

  return (
    <div className="page-container">
      {/* Header Row with Title + Stats + Button */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Space size={32} align="center">
            <Title level={4} style={{ margin: 0 }}>
              <FolderOutlined style={{ marginRight: 8 }} />
              {t('projects.title')}
              <Text type="secondary" style={{ marginLeft: 12, fontSize: 14, fontWeight: 400 }}>
                {stats?.total || 0} {t('common.total')}
              </Text>
            </Title>
            {/* Inline Stats - Premium styled pills */}
            <Space size={8}>
              <Tooltip title={t('projects.stats.downTooltip')}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  background: downCount > 0 
                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                    : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)'),
                  color: downCount > 0 ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8'),
                  border: `1px solid ${downCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'transparent'}`,
                }}>
                  <CloseCircleOutlined style={{ fontSize: 12 }} />
                  <span>{downCount}</span>
                  <span style={{ opacity: 0.8 }}>{t('projects.stats.down')}</span>
                </div>
              </Tooltip>
              <Tooltip title={t('projects.stats.hackedTooltip')}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: hackedCount > 0 
                    ? (isDark ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.15)')
                    : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)'),
                  color: hackedCount > 0 ? '#dc2626' : (isDark ? '#64748b' : '#94a3b8'),
                  border: `1px solid ${hackedCount > 0 ? 'rgba(220, 38, 38, 0.5)' : 'transparent'}`,
                  boxShadow: hackedCount > 0 ? '0 0 12px rgba(220, 38, 38, 0.3)' : 'none',
                }}>
                  <LockOutlined style={{ fontSize: 12 }} />
                  <span>{hackedCount}</span>
                  <span style={{ opacity: 0.9 }}>{t('projects.stats.hacked')}</span>
                </div>
              </Tooltip>
              <Tooltip title={t('projects.stats.atRiskTooltip')}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  background: compromisedCount > 0 
                    ? (isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)')
                    : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)'),
                  color: compromisedCount > 0 ? '#f97316' : (isDark ? '#64748b' : '#94a3b8'),
                  border: `1px solid ${compromisedCount > 0 ? 'rgba(249, 115, 22, 0.3)' : 'transparent'}`,
                }}>
                  <ExclamationCircleOutlined style={{ fontSize: 12 }} />
                  <span>{compromisedCount}</span>
                  <span style={{ opacity: 0.8 }}>{t('projects.stats.atRisk')}</span>
                </div>
              </Tooltip>
              <Tooltip title={t('projects.stats.monitoringTooltip')}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  background: monitoringCount > 0 
                    ? (isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)')
                    : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)'),
                  color: monitoringCount > 0 ? '#eab308' : (isDark ? '#64748b' : '#94a3b8'),
                  border: `1px solid ${monitoringCount > 0 ? 'rgba(234, 179, 8, 0.3)' : 'transparent'}`,
                }}>
                  <WarningOutlined style={{ fontSize: 12 }} />
                  <span>{monitoringCount}</span>
                  <span style={{ opacity: 0.8 }}>{t('projects.stats.monitoring')}</span>
                </div>
              </Tooltip>
            </Space>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            {t('projects.newProject')}
          </Button>
        </Col>
      </Row>

      {/* Create Modal */}
      <ProjectFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Filters - All in one row */}
      <Card 
        style={{ marginBottom: 16, borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }} 
        bodyStyle={{ padding: 12 }}
      >
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder="Search projects..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            style={{ width: 120 }}
            value={filters.health}
            onChange={(value) => setFilters(f => ({ ...f, health: value, page: 1 }))}
            options={[
              { label: t('projects.filters.allHealth'), value: 'all' },
              { label: t('projects.health.online'), value: 'online' },
              { label: t('projects.health.down_error'), value: 'down_error' },
              { label: t('projects.health.maintenance'), value: 'updating' },
            ]}
          />
          <Select
            style={{ width: 130 }}
            value={filters.security}
            onChange={(value) => setFilters(f => ({ ...f, security: value, page: 1 }))}
            options={[
              { label: t('projects.filters.allSecurity'), value: 'all' },
              { label: t('projects.security.secure'), value: 'secure' },
              { label: t('projects.security.monitoring'), value: 'monitoring' },
              { label: t('projects.stats.atRisk'), value: 'compromised' },
              { label: t('projects.stats.hacked'), value: 'hacked' },
            ]}
          />
          {filterOptions?.managers && (
            <Select
              style={{ width: 150 }}
              value={filters.manager_id}
              onChange={(value) => setFilters(f => ({ ...f, manager_id: value, page: 1 }))}
              options={[
                { label: t('projects.filters.allManagers'), value: undefined },
                ...filterOptions.managers.map((m: any) => ({ label: m.name, value: m.id })),
              ]}
              placeholder={t('projects.form.manager')}
              allowClear
            />
          )}
          {filterOptions?.developers && (
            <Select
              style={{ width: 150 }}
              value={filters.developer_id}
              onChange={(value) => setFilters(f => ({ ...f, developer_id: value, page: 1 }))}
              options={[
                { label: t('projects.filters.allDevelopers'), value: undefined },
                ...filterOptions.developers.map((d: any) => ({ label: d.name, value: d.id })),
              ]}
              placeholder={t('projects.form.developer')}
              allowClear
            />
          )}
          {filterOptions?.tags && filterOptions.tags.length > 0 && (
            <Select
              style={{ width: 140 }}
              value={(filters as any).tag || undefined}
              onChange={(value) => setFilters(f => ({ ...f, tag: value || undefined, page: 1 }))}
              options={[
                { label: t('projects.filters.allTags'), value: '' },
                ...filterOptions.tags.map((t: any) => ({ 
                  label: <Tag color={t.color || 'default'}>{t.name}</Tag>, 
                  value: t.slug 
                })),
              ]}
              placeholder="Tag"
              allowClear
            />
          )}
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              refetch();
              refetchStats();
            }}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card 
        style={{ borderRadius: 12, background: isDark ? '#1e293b' : '#fff' }} 
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: data?.current_page || 1,
            total: data?.total || 0,
            pageSize: filters.per_page,
            onChange: (page, pageSize) => setFilters(f => ({ ...f, page, per_page: pageSize })),
            showSizeChanger: true,
            pageSizeOptions: ['15', '30', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/projects/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
