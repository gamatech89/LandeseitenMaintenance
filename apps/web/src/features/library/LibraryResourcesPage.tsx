/**
 * Library Resources Page
 * 
 * Manage global shared files that can be linked to multiple projects.
 * Upload, edit, delete library resources and see usage across projects.
 */

import { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Dropdown,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  App,
  Empty,
  Tooltip,
  Badge,
} from 'antd';
import type { MenuProps, TableProps, UploadFile } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useThemeStore } from '@/stores/theme';
import type { LibraryResource } from '@/lib/library-resources-api';

const { Title, Text } = Typography;

export default function LibraryResourcesPage() {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Fetch library resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['library-resources'],
    queryFn: () => api.libraryResources.getAll().then(r => r.data.data || r.data || []),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['library-resources-categories'],
    queryFn: () => api.libraryResources.getCategories().then(r => r.data.data || r.data),
  });

  const categories = categoriesData?.categories || [];
  const suggestedCategories = categoriesData?.suggested || ['guides', 'templates', 'security', 'documentation', 'checklists'];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.libraryResources.create(data),
    onSuccess: () => {
      message.success('Library resource uploaded');
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
      setShowUploadModal(false);
      form.resetFields();
      setFileList([]);
    },
    onError: () => {
      message.error('Failed to upload resource');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => 
      api.libraryResources.update(id, data),
    onSuccess: () => {
      message.success('Library resource updated');
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
      setEditingResource(null);
      form.resetFields();
      setFileList([]);
    },
    onError: () => {
      message.error('Failed to update resource');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.libraryResources.delete(id),
    onSuccess: () => {
      message.success('Library resource deleted');
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
    },
    onError: () => {
      message.error('Failed to delete resource');
    },
  });

  const handleSubmit = (values: { title: string; category?: string; notes?: string }) => {
    const formData = new FormData();
    formData.append('title', values.title);
    if (values.category) formData.append('category', values.category);
    if (values.notes) formData.append('notes', values.notes);

    if (editingResource) {
      // Update - file is optional
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }
      updateMutation.mutate({ id: editingResource.id, data: formData });
    } else {
      // Create - file is required
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
        createMutation.mutate(formData);
      } else {
        message.error('Please select a file to upload');
      }
    }
  };

  const handleDownload = async (resource: LibraryResource) => {
    try {
      const response = await api.libraryResources.download(resource.id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.file_name || 'download';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to download file');
    }
  };

  const openEditModal = (resource: LibraryResource) => {
    setEditingResource(resource);
    form.setFieldsValue({
      title: resource.title,
      category: resource.category,
      notes: resource.notes,
    });
    setFileList([]);
  };

  const columns: TableProps<LibraryResource>['columns'] = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#a855f7' }} />
          <Text strong>{title}</Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => category ? <Tag color="purple">{category}</Tag> : '-',
      filters: [...new Set(resources.map((r: LibraryResource) => r.category).filter(Boolean))].map(cat => ({
        text: cat as string,
        value: cat as string,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'File',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (fileName: string, record: LibraryResource) => (
        <Tooltip title="Click to download">
          <Button 
            type="link" 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            style={{ padding: 0 }}
          >
            {fileName} ({record.formatted_file_size})
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Used In',
      dataIndex: 'projects_count',
      key: 'projects_count',
      width: 100,
      render: (count: number) => (
        <Badge 
          count={count || 0} 
          showZero 
          color={count > 0 ? '#22c55e' : '#94a3b8'}
          style={{ fontWeight: 600 }}
        />
      ),
      sorter: (a, b) => (a.projects_count || 0) - (b.projects_count || 0),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: LibraryResource) => {
        const items: MenuProps['items'] = [
          {
            key: 'download',
            icon: <DownloadOutlined />,
            label: 'Download',
            onClick: () => handleDownload(record),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => openEditModal(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: 'Delete Library Resource?',
                content: record.projects_count && record.projects_count > 0 
                  ? `This file is linked to ${record.projects_count} project(s). It will be unlinked from all of them.`
                  : 'This action cannot be undone.',
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: () => deleteMutation.mutate(record.id),
              });
            },
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      },
    },
  ];

  const allCategories = [...new Set([...categories, ...suggestedCategories])];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOpenOutlined style={{ color: '#a855f7' }} />
            Library Resources
          </Title>
          <Text type="secondary">
            Shared files that can be linked to multiple projects
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<UploadOutlined />} 
          onClick={() => {
            setEditingResource(null);
            form.resetFields();
            setFileList([]);
            setShowUploadModal(true);
          }}
        >
          Upload File
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Card size="small" style={{ flex: 1, background: isDark ? '#1e293b' : '#f8fafc' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#a855f7' }}>{resources.length}</div>
            <Text type="secondary">Total Files</Text>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1, background: isDark ? '#1e293b' : '#f8fafc' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
              {resources.filter((r: LibraryResource) => (r.projects_count || 0) > 0).length}
            </div>
            <Text type="secondary">In Use</Text>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1, background: isDark ? '#1e293b' : '#f8fafc' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
              {[...new Set(resources.map((r: LibraryResource) => r.category).filter(Boolean))].length}
            </div>
            <Text type="secondary">Categories</Text>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card
        style={{
          borderRadius: 12,
          background: isDark ? '#1e293b' : '#fff',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {resources.length > 0 ? (
          <Table
            dataSource={resources as LibraryResource[]}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={resources.length > 10 ? { pageSize: 10 } : false}
            size="middle"
          />
        ) : (
          <Empty
            image={<FolderOpenOutlined style={{ fontSize: 48, color: '#94a3b8' }} />}
            description={
              <div style={{ padding: 24 }}>
                <Text type="secondary">No library resources yet</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />}
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload First File
                  </Button>
                </div>
              </div>
            }
            style={{ padding: 48 }}
          />
        )}
      </Card>

      {/* Usage Info */}
      <Card size="small" style={{ marginTop: 16, background: isDark ? '#1e293b' : '#f8fafc' }}>
        <Space>
          <LinkOutlined style={{ color: '#3b82f6' }} />
          <Text type="secondary">
            <strong>Tip:</strong> Go to any project's Resources tab and click "Link from Library" to use these files.
          </Text>
        </Space>
      </Card>

      {/* Upload/Edit Modal */}
      <Modal
        title={editingResource ? 'Edit Library Resource' : 'Upload to Library'}
        open={showUploadModal || !!editingResource}
        onCancel={() => {
          setShowUploadModal(false);
          setEditingResource(null);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => form.submit()}
        okText={editingResource ? 'Update' : 'Upload'}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="e.g. Developer Guide, Security Checklist" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
          >
            <Select
              placeholder="Select or type a category"
              allowClear
              showSearch
              options={allCategories.map(cat => ({ label: cat, value: cat }))}
            />
          </Form.Item>

          <Form.Item
            label={editingResource ? "Replace File (optional)" : "File"}
            required={!editingResource}
          >
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                {editingResource ? 'Select New File' : 'Select File'}
              </Button>
            </Upload>
            {editingResource && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Current: {editingResource.file_name}
              </Text>
            )}
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={2} placeholder="Optional notes about this resource..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
