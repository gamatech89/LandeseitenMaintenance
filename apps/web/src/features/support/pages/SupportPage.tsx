/**
 * Support Tickets Page
 * 
 * Global view of all support tickets across projects.
 * Accessible to PMs and Admins only.
 */

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Badge,
  Space,
  Modal,
  Typography,
  Select,
  Tooltip,
  Empty,
  Spin,
  message,
  Descriptions,
  Divider,
  Input,
} from 'antd';
import {
  CustomerServiceOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  LinkOutlined,
  MailOutlined,
  GlobalOutlined,
  SearchOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SupportTicket } from '@/lib/support-tickets-api';
import {
  TICKET_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
} from '@/lib/support-tickets-api';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useThemeStore } from '@/stores/theme';

dayjs.extend(relativeTime);

const { Text, Paragraph, Title } = Typography;

export function SupportPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch global tickets
  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ['all-support-tickets'],
    queryFn: () => api.supportTickets.getAllGlobal(),
    staleTime: 30000,
  });

  const tickets = (ticketsResponse?.data as any)?.data || ticketsResponse?.data || [];

  // Filter tickets
  const filteredTickets = tickets.filter((t: SupportTicket) => {
    const matchesSearch =
      !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Update ticket mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.supportTickets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
      message.success('Ticket updated');
    },
    onError: () => {
      message.error('Failed to update ticket');
    },
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: (ticketId: number) => api.supportTickets.createTodo(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
      message.success('Todo created from ticket!');
      setDetailModalOpen(false);
    },
    onError: () => {
      message.error('Failed to create todo');
    },
  });

  // Mark as read when opening detail
  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
    if (!ticket.is_read) {
      api.supportTickets.markAsRead(ticket.id);
    }
  };

  // Table columns
  const columns = [
    {
      title: '#',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 100,
      render: (text: string, record: SupportTicket) => (
        <Space>
          {!record.is_read && <Badge status="processing" />}
          <Text strong={!record.is_read}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 180,
      render: (project: any) => (
        project ? (
          <Link to={`/projects/${project.id}`}>
            <Space>
              <ProjectOutlined />
              <Text style={{ color: isDark ? '#a78bfa' : '#7c3aed' }}>{project.name}</Text>
            </Space>
          </Link>
        ) : '-'
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeInfo = TICKET_TYPE_LABELS[type];
        return (
          <Tooltip title={typeInfo?.label}>
            <span style={{ fontSize: 18 }}>{typeInfo?.emoji}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: SupportTicket) => (
        <div>
          <Text strong={!record.is_read}>{text}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.client_name || record.client_email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const statusInfo = TICKET_STATUS_LABELS[status];
        return <Tag color={statusInfo?.color}>{statusInfo?.label}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const priorityInfo = TICKET_PRIORITY_LABELS[priority];
        return <Tag color={priorityInfo?.color}>{priorityInfo?.label}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm')}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: SupportTicket) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        />
      ),
    },
  ];

  // Count by status
  const openCount = tickets.filter((t: SupportTicket) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t: SupportTicket) => t.status === 'in_progress').length;
  const unreadCount = tickets.filter((t: SupportTicket) => !t.is_read).length;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <CustomerServiceOutlined style={{ marginRight: 12 }} />
          Support Tickets
          {unreadCount > 0 && (
            <Badge 
              count={unreadCount} 
              style={{ marginLeft: 12, backgroundColor: '#1890ff' }} 
            />
          )}
        </Title>
        <Text type="secondary">All support requests from clients across projects</Text>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Space wrap size={16}>
          <Input
            placeholder="Search tickets..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
          >
            <Select.Option value="all">All Status</Select.Option>
            {Object.entries(TICKET_STATUS_LABELS).map(([key, info]) => (
              <Select.Option key={key} value={key}>
                <Tag color={info.color}>{info.label}</Tag>
              </Select.Option>
            ))}
          </Select>
          <Tag icon={<ClockCircleOutlined />} color="blue">
            {openCount} Open
          </Tag>
          <Tag icon={<ExclamationCircleOutlined />} color="orange">
            {inProgressCount} In Progress
          </Tag>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchQuery ? 'No matching tickets' : 'No support tickets yet'}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTickets}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            rowClassName={(record) => (!record.is_read ? 'ticket-unread' : '')}
            onRow={(record) => ({
              onClick: () => handleViewTicket(record),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      {/* Ticket Detail Modal */}
      <Modal
        title={
          <Space>
            <span style={{ fontSize: 20 }}>
              {TICKET_TYPE_LABELS[selectedTicket?.type || 'question']?.emoji}
            </span>
            {selectedTicket?.ticket_number}
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>,
          !selectedTicket?.todo_id && (
            <Button
              key="create-todo"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => selectedTicket && createTodoMutation.mutate(selectedTicket.id)}
              loading={createTodoMutation.isPending}
            >
              Create Todo
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedTicket && (
          <>
            <Title level={4} style={{ marginTop: 0 }}>
              {selectedTicket.subject}
            </Title>

            <Space style={{ marginBottom: 16 }}>
              <Select
                value={selectedTicket.status}
                onChange={(value) =>
                  updateMutation.mutate({ id: selectedTicket.id, data: { status: value } })
                }
                style={{ width: 130 }}
                loading={updateMutation.isPending}
              >
                {Object.entries(TICKET_STATUS_LABELS).map(([key, info]) => (
                  <Select.Option key={key} value={key}>
                    <Tag color={info.color}>{info.label}</Tag>
                  </Select.Option>
                ))}
              </Select>

              <Select
                value={selectedTicket.priority}
                onChange={(value) =>
                  updateMutation.mutate({ id: selectedTicket.id, data: { priority: value } })
                }
                style={{ width: 120 }}
                loading={updateMutation.isPending}
              >
                {Object.entries(TICKET_PRIORITY_LABELS).map(([key, info]) => (
                  <Select.Option key={key} value={key}>
                    <Tag color={info.color}>{info.label}</Tag>
                  </Select.Option>
                ))}
              </Select>

              {selectedTicket.todo_id && (
                <Tag icon={<LinkOutlined />} color="green">
                  Linked to Todo
                </Tag>
              )}
            </Space>

            <Divider />

            <Descriptions column={2} size="small">
              <Descriptions.Item label={<><ProjectOutlined /> Project</>}>
                <Link to={`/projects/${selectedTicket.project_id}`}>
                  {(selectedTicket as any).project_name || `Project #${selectedTicket.project_id}`}
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={TICKET_TYPE_LABELS[selectedTicket.type]?.color}>
                  {TICKET_TYPE_LABELS[selectedTicket.type]?.emoji}{' '}
                  {TICKET_TYPE_LABELS[selectedTicket.type]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                <a href={`mailto:${selectedTicket.client_email}`}>
                  {selectedTicket.client_email}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                {selectedTicket.client_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<><GlobalOutlined /> Problem Page</>} span={2}>
                {selectedTicket.problem_page ? (
                  <a href={selectedTicket.problem_page} target="_blank" rel="noreferrer">
                    {selectedTicket.problem_page}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(selectedTicket.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Message</Divider>

            <div
              style={{
                background: isDark ? '#2d2d2d' : '#f5f5f5',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              <Paragraph style={{ margin: 0 }}>{selectedTicket.message}</Paragraph>
            </div>

            {selectedTicket.resolved_at && (
              <>
                <Divider>Resolution</Divider>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> Resolved{' '}
                    {dayjs(selectedTicket.resolved_at).fromNow()}
                  </Text>
                  {selectedTicket.resolution_notes && (
                    <Paragraph>{selectedTicket.resolution_notes}</Paragraph>
                  )}
                </Space>
              </>
            )}
          </>
        )}
      </Modal>

      <style>{`
        .ticket-unread {
          background-color: ${isDark ? 'rgba(24, 144, 255, 0.1)' : '#e6f7ff'} !important;
        }
        .ticket-unread:hover {
          background-color: ${isDark ? 'rgba(24, 144, 255, 0.15)' : '#bae7ff'} !important;
        }
      `}</style>
    </>
  );
}

export default SupportPage;
