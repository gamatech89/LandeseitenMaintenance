import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  App,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  LockOutlined,
  CopyOutlined,
  LinkOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, apiClient } from '@/lib/api';
import type { Credential } from '@lsm/types';
import type { VaultFilters } from '@lsm/api-client';
import type { ColumnsType } from 'antd/es/table';
import { AddCredentialModal } from '../components/AddCredentialModal';
import { ShareCredentialModal } from '../components/ShareCredentialModal';
import { EditCredentialModal } from '../components/EditCredentialModal';

const { Title, Text } = Typography;

// ... options ...
const credentialTypeOptions = [
  { label: 'All Types', value: undefined },
  { label: 'WordPress', value: 'wordpress' },
  { label: 'SSH', value: 'ssh' },
  { label: 'FTP', value: 'ftp' },
  { label: 'Database', value: 'database' },
  { label: 'Hosting', value: 'hosting' },
  { label: 'Email', value: 'email' },
  { label: 'API', value: 'api' },
  { label: 'Other', value: 'other' },
];

export function VaultPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<VaultFilters>({
    page: 1,
    per_page: 20,
    search: '',
    type: undefined,
    sort_by: 'updated_at',
    sort_order: 'desc',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shareCredential, setShareCredential] = useState<Credential | null>(null);
  const [editCredential, setEditCredential] = useState<Credential | null>(null);
  const { t } = useTranslation();

  // Fetch credentials
  const { data, isLoading } = useQuery({
    queryKey: ['vault', filters],
    queryFn: () => api.vault.list(filters).then(r => r.data),
  });

  // Reveal mutation
  const revealMutation = useMutation({
    mutationFn: (id: number) => api.credentials.reveal(id),
    onSuccess: (response) => {
      const password = response.data.data?.password;
      if (password) {
        navigator.clipboard.writeText(password);
        message.success(t('vault.copied'));
      }
    },
    onError: () => {
      message.error(t('vault.messages.revealError'));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/credentials/${id}`),
    onSuccess: () => {
       message.success(t('vault.messages.deleted'));
       queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
    onError: () => {
       message.error(t('common.deleteError'));
    }
  });

  const columns: ColumnsType<Credential> = [
    {
      title: 'Title',
      key: 'title',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <div>
            <Link to={`/projects/${record.project_id}`} style={{ fontSize: 12 }}>
              {record.project?.name || 'Unknown Project'}
            </Link>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        let color = 'default';
        switch (type) {
          case 'ssh': color = 'geekblue'; break;
          case 'database': color = 'orange'; break;
          case 'wordpress': color = 'blue'; break;
          case 'ftp': color = 'cyan'; break;
          case 'api': color = 'purple'; break;
          case 'email': color = 'green'; break;
          case 'hosting': color = 'magenta'; break;
        }
        return <Tag color={color}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      render: (username) => username || <Text type="secondary">-</Text>,
    },
    {
      title: 'Password',
      key: 'password',
      width: 120,
      render: (_, record) =>
        record.has_password ? (
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => revealMutation.mutate(record.id)}
            loading={revealMutation.isPending && revealMutation.variables === record.id}
          >
            Copy
          </Button>
        ) : (
          <Text type="secondary">No password</Text>
        ),
    },
    {
      title: 'URL',
      key: 'url',
      width: 80,
      render: (_, record) =>
        record.url ? (
          <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ whiteSpace: 'nowrap' }}>
            <LinkOutlined /> Open
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<ShareAltOutlined style={{ color: '#8b5cf6' }} />} 
            onClick={() => setShareCredential(record)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#64748b' }} />}
            onClick={() => setEditCredential(record)}
          />
          <Popconfirm
             title="Delete credential"
             description="Are you sure required this?"
             onConfirm={() => deleteMutation.mutate(record.id)}
             okText="Yes"
             cancelText="No"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <LockOutlined style={{ fontSize: 24, color: '#6366f1' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>{t('vault.title')}</Title>
              <Text type="secondary">
                {t('vault.subtitle')}
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
           <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
              {t('vault.addCredential')}
           </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search credentials..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters(f => ({ ...f, type: value, page: 1 }))}
              options={credentialTypeOptions}
              placeholder="Filter by type"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.sort_by}
              onChange={(value) => setFilters(f => ({ ...f, sort_by: value as VaultFilters['sort_by'] }))}
              options={[
                { label: 'Recently Updated', value: 'updated_at' },
                { label: 'Title', value: 'title' },
                { label: 'Project', value: 'project' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Actions */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: data?.current_page || 1,
            total: data?.total || 0,
            pageSize: filters.per_page,
            onChange: (page) => setFilters(f => ({ ...f, page })),
            showSizeChanger: false,
          }}
        />
      </Card>
      
      <AddCredentialModal 
         open={isAddModalOpen} 
         onClose={() => setIsAddModalOpen(false)} 
      />
      
      <ShareCredentialModal
         open={!!shareCredential}
         credential={shareCredential}
         onClose={() => setShareCredential(null)}
      />

      <EditCredentialModal
         open={!!editCredential}
         credential={editCredential}
         onClose={() => setEditCredential(null)}
      />
    </div>
  );
}
