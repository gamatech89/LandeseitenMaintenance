/**
 * Team Page
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Input,
  InputNumber,
  Select,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Avatar,
  Modal,
  Form,
  App,
} from 'antd';
import {
  SearchOutlined,
  TeamOutlined,
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getRoleConfig } from '@lsm/utils';
import { useIsAdmin } from '@/stores/auth';
import type { User, CreateUserRequest } from '@lsm/types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const roleOptions = [
  { labelKey: 'team.roles.admin', value: 'admin' },
  { labelKey: 'team.roles.manager', value: 'manager' },
  { labelKey: 'team.roles.developer', value: 'developer' },
];

export function TeamPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const { t } = useTranslation();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Fetch team
  const { data, isLoading } = useQuery({
    queryKey: ['team', { search, role: roleFilter, tag: tagFilter }],
    queryFn: () => api.team.list({ search, role: roleFilter, tag: tagFilter } as any).then(r => r.data.data),
  });

  // Fetch tags for filter and form
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.tags.list().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => api.team.create(data),
    onSuccess: () => {
      message.success(t('team.messages.created'));
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setShowModal(false);
      form.resetFields();
    },
    onError: () => {
      message.error(t('common.saveError'));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserRequest> }) =>
      api.team.update(id, data),
    onSuccess: () => {
      message.success(t('team.messages.updated'));
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setShowModal(false);
      setEditingUser(null);
      form.resetFields();
    },
    onError: () => {
      message.error(t('common.saveError'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.team.delete(id),
    onSuccess: () => {
      message.success(t('team.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => {
      message.error(t('common.deleteError'));
    },
  });

  const handleSubmit = async (values: CreateUserRequest) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      hourly_rate: (user as any).hourly_rate ?? 22,
      tag_ids: (user as any).tags?.map((t: any) => t.id) || [],
    });
    setShowModal(true);
  };

  const handleDelete = (user: User) => {
    modal.confirm({
      title: t('team.deleteMember'),
      content: `${t('common.confirmDelete')}`,
      okText: t('common.delete'),
      okType: 'danger',
      onOk: () => deleteMutation.mutate(user.id),
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 120,
      render: (_, record) => {
        const config = getRoleConfig(record.role);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Tags',
      key: 'tags',
      width: 150,
      render: (_, record) => {
        const userTags = (record as any).tags || [];
        return (
          <Space size={4} wrap>
            {userTags.map((tag: any) => (
              <Tag key={tag.id} color={tag.color || 'default'} style={{ margin: 0 }}>
                {tag.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Hourly Rate',
      key: 'hourly_rate',
      width: 100,
      render: (_, record) => {
        const rate = (record as any).hourly_rate ?? 22;
        return <Text strong style={{ color: '#3AA68D' }}>${rate}/hr</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) =>
        isAdmin && (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#64748b' }}
            >
              Edit
            </Button>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
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
            <TeamOutlined style={{ fontSize: 24, color: '#6366f1' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>{t('team.title')}</Title>
              <Text type="secondary">
                {t('team.subtitle')}
              </Text>
            </div>
          </Space>
        </Col>
        {isAdmin && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null);
                form.resetFields();
                setShowModal(true);
              }}
            >
              {t('team.addMember')}
            </Button>
          </Col>
        )}
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search team..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ label: 'All Roles', value: undefined }, ...roleOptions]}
              placeholder="Filter by role"
              allowClear
            />
          </Col>
          {tags && tags.length > 0 && (
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                value={tagFilter || undefined}
                onChange={(value) => setTagFilter(value || undefined)}
                options={[
                  { label: 'All Tags', value: '' },
                  ...tags.map((t: any) => ({ label: t.name, value: t.slug })),
                ]}
                placeholder="Filter by tag"
                allowClear
              />
            </Col>
          )}
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? 'Edit Team Member' : 'Add Team Member'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select options={roleOptions} placeholder="Select role" />
          </Form.Item>

          <Form.Item
            name="hourly_rate"
            label="Hourly Rate ($)"
            initialValue={22}
            rules={[{ required: true, message: 'Please enter hourly rate' }]}
          >
            <InputNumber 
              min={0} 
              max={500} 
              step={0.5}
              style={{ width: '100%' }}
              addonBefore="$"
              addonAfter="/hr"
            />
          </Form.Item>

          {tags && tags.length > 0 && (
            <Form.Item name="tag_ids" label="Tags">
              <Select
                mode="multiple"
                options={tags.map((t: any) => ({ label: t.name, value: t.id }))}
                placeholder="Select tags"
                allowClear
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
