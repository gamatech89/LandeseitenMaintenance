/**
 * My Time Page
 *
 * Developer's view of their time entries with:
 * - Today/Week/Month/All view toggle
 * - Custom date range picker
 * - Manual entry form
 * - Select entries to submit for approval
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  DatePicker,
  Segmented,
  Statistic,
  Row,
  Col,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  App,
  Popconfirm,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { api } from '@/lib/api';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Brand colors
const BRAND = {
  deepPurple: '#440C71',
  vibrantPurple: '#6B21A8',
  teal: '#3AA68D',
};

interface TimeEntry {
  id: number;
  project_id: number;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  formatted_duration: string;
  is_billable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  project?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
}

const statusColors: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  paid: 'purple',
};

// Helper to format minutes as HH:MM without decimals
const formatDuration = (minutes: number): string => {
  const totalMins = Math.round(minutes);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
};

type ViewType = 'today' | 'week' | 'month' | 'all';

export function MyTimePage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // State
  const [view, setView] = useState<ViewType>('today');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const pageSize = 25;

  // Calculate date range based on view
  const getDateParams = () => {
    switch (view) {
      case 'today':
        return { date_from: dayjs().format('YYYY-MM-DD'), date_to: dayjs().format('YYYY-MM-DD') };
      case 'week':
        return { week: selectedDate.isoWeek(), year: selectedDate.year() };
      case 'month':
        return { 
          date_from: selectedDate.startOf('month').format('YYYY-MM-DD'), 
          date_to: selectedDate.endOf('month').format('YYYY-MM-DD') 
        };
      case 'all':
        if (dateRange) {
          return { date_from: dateRange[0].format('YYYY-MM-DD'), date_to: dateRange[1].format('YYYY-MM-DD') };
        }
        return { per_page: 1000 }; // Get all entries
      default:
        return {};
    }
  };

  // Fetch today's entries
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['time-entries', 'today'],
    queryFn: () => api.timeEntries.today().then((r: { data: { success: boolean; data: { entries: TimeEntry[]; total_minutes: number; formatted_total: string } } }) => r.data.data),
    enabled: view === 'today',
  });

  // Fetch entries based on view
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['time-entries', view, selectedDate.format('YYYY-MM-DD'), dateRange?.map(d => d.format('YYYY-MM-DD')), page],
    queryFn: () => api.timeEntries.list({ ...getDateParams(), per_page: pageSize, page }).then((r: { data: { data: TimeEntry[]; meta?: { total: number; current_page: number } } }) => ({
      entries: r.data.data,
      meta: r.data.meta || { total: r.data.data.length, current_page: 1 }
    })),
    enabled: view !== 'today',
  });

  // Fetch projects for the form
  const { data: projects } = useQuery({
    queryKey: ['timer', 'projects'],
    queryFn: () => api.timer.getProjects().then((r: { data: { success: boolean; data: Project[] } }) => r.data.data),
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: (data: { project_id: number; description?: string; started_at: string; ended_at: string }) =>
      api.timeEntries.create(data).then((r: { data: { success: boolean } }) => r.data),
    onSuccess: () => {
      message.success(t('time.messages.created'));
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || t('common.saveError'));
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { project_id?: number; description?: string; started_at?: string; ended_at?: string } }) =>
      api.timeEntries.update(id, data).then((r: { data: { success: boolean } }) => r.data),
    onSuccess: () => {
      message.success(t('time.messages.updated'));
      setIsModalOpen(false);
      setEditingEntry(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || t('common.saveError'));
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.timeEntries.delete(id).then((r: { data: { success: boolean } }) => r.data),
    onSuccess: () => {
      message.success(t('time.messages.deleted'));
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  // Submit selected entries mutation
  const submitEntriesMutation = useMutation({
    mutationFn: async (entryIds: number[]) => {
      const { apiClient } = await import('@/lib/api');
      return apiClient.post('/time-entries/submit', { entry_ids: entryIds }).then((r: { data: { success: boolean; message?: string } }) => r.data);
    },
    onSuccess: (data: { message?: string }) => {
      message.success(data.message || 'Entries submitted for approval');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to submit entries');
    },
  });

  // Handle form submit
  const handleFormSubmit = (values: { project_id: number; description?: string; date: Dayjs; start_time: Dayjs; end_time: Dayjs }) => {
    const date = values.date.format('YYYY-MM-DD');
    const started_at = `${date} ${values.start_time.format('HH:mm:ss')}`;
    const ended_at = `${date} ${values.end_time.format('HH:mm:ss')}`;

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          project_id: values.project_id,
          description: values.description,
          started_at,
          ended_at,
        },
      });
    } else {
      createMutation.mutate({
        project_id: values.project_id,
        description: values.description,
        started_at,
        ended_at,
      });
    }
  };

  // Open edit modal
  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      project_id: entry.project_id,
      description: entry.description,
      date: dayjs(entry.started_at),
      start_time: dayjs(entry.started_at),
      end_time: entry.ended_at ? dayjs(entry.ended_at) : undefined,
    });
    setIsModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (name: string) => <Tag color={BRAND.vibrantPurple}>{name}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <Text type="secondary">No description</Text>,
    },
    {
      title: 'Time',
      key: 'time',
      render: (_: unknown, record: TimeEntry) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(record.started_at).format('HH:mm')} - {record.ended_at ? dayjs(record.ended_at).format('HH:mm') : '...'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(record.started_at).format('MMM D, YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'formatted_duration',
      key: 'duration',
      render: (duration: string) => <Text strong>{duration}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: TimeEntry) => (
        record.status === 'draft' && (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm title="Delete this entry?" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      ),
    },
  ];

  const entries = view === 'today' ? (todayData?.entries || []) : (entriesData?.entries || []);
  const totalMinutes = view === 'today' 
    ? (todayData?.total_minutes || 0) 
    : entries.reduce((acc: number, e: TimeEntry) => acc + (e.duration_minutes || 0), 0);
  const formattedTotal = view === 'today' 
    ? (todayData?.formatted_total || '0:00') 
    : formatDuration(totalMinutes);
  const totalEntries = view === 'today' ? entries.length : (entriesData?.meta?.total || entries.length);
  
  // Count draft entries
  const draftEntries = entries.filter((e: TimeEntry) => e.status === 'draft');
  const draftMinutes = draftEntries.reduce((acc: number, e: TimeEntry) => acc + (e.duration_minutes || 0), 0);

  // Selected entries info
  const selectedDraftIds = selectedRowKeys.filter(id => draftEntries.some((e: TimeEntry) => e.id === id));
  const selectedMinutes = entries
    .filter((e: TimeEntry) => selectedRowKeys.includes(e.id))
    .reduce((acc: number, e: TimeEntry) => acc + (e.duration_minutes || 0), 0);

  // View title helper
  const getViewTitle = () => {
    switch (view) {
      case 'today': return "Today's Total";
      case 'week': return `Week ${selectedDate.isoWeek()} Total`;
      case 'month': return `${selectedDate.format('MMMM YYYY')} Total`;
      case 'all': return 'All Time Total';
    }
  };

  // Row selection config - only allow selecting draft entries
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
    getCheckboxProps: (record: TimeEntry) => ({
      disabled: record.status !== 'draft',
      name: record.id.toString(),
    }),
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{t('time.title')}</Title>
          <Text type="secondary">{t('time.subtitle')}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingEntry(null);
            form.resetFields();
            form.setFieldsValue({ date: dayjs(), start_time: dayjs().startOf('hour'), end_time: dayjs() });
            setIsModalOpen(true);
          }}
          style={{ background: BRAND.teal }}
        >
          {t('time.addEntry')}
        </Button>
      </div>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={getViewTitle()}
              value={formattedTotal}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: BRAND.deepPurple }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Entries"
              value={totalEntries}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Draft (Unsubmitted)"
              value={formatDuration(draftMinutes)}
              suffix={<Text type="secondary">({draftEntries.length} entries)</Text>}
              prefix={<EditOutlined />}
              valueStyle={{ color: draftEntries.length > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Selection Action Bar */}
      {selectedDraftIds.length > 0 && (
        <Alert
          type="info"
          style={{ marginBottom: 16 }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                {selectedDraftIds.length} draft {selectedDraftIds.length === 1 ? 'entry' : 'entries'} selected ({formatDuration(selectedMinutes)})
              </span>
              <Space>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  Clear Selection
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => submitEntriesMutation.mutate(selectedDraftIds)}
                  loading={submitEntriesMutation.isPending}
                >
                  Submit Selected for Approval
                </Button>
              </Space>
            </div>
          }
        />
      )}

      {/* View Toggle */}
      <Card
        title={
          <Space wrap>
            <Segmented
              options={[
                { label: 'Today', value: 'today', icon: <ClockCircleOutlined /> },
                { label: 'Week', value: 'week', icon: <CalendarOutlined /> },
                { label: 'Month', value: 'month', icon: <CalendarOutlined /> },
                { label: 'All', value: 'all', icon: <HistoryOutlined /> },
              ]}
              value={view}
              onChange={(v) => { setView(v as ViewType); setPage(1); setSelectedRowKeys([]); }}
            />
            {view === 'week' && (
              <DatePicker
                picker="week"
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="[Week] w, YYYY"
              />
            )}
            {view === 'month' && (
              <DatePicker
                picker="month"
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="MMMM YYYY"
              />
            )}
            {view === 'all' && (
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                placeholder={['From', 'To']}
                allowClear
              />
            )}
          </Space>
        }
        extra={
          draftEntries.length > 0 && selectedDraftIds.length === 0 && (
            <Button 
              size="small" 
              onClick={() => setSelectedRowKeys(draftEntries.map((e: TimeEntry) => e.id))}
            >
              Select All Draft
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={todayLoading || entriesLoading}
          rowSelection={rowSelection}
          pagination={view !== 'today' ? {
            current: page,
            pageSize,
            total: totalEntries,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `${total} entries`,
          } : false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  view === 'today' 
                    ? "No entries today. Start the timer!" 
                    : view === 'all' 
                      ? "No entries found. Use date range to filter." 
                      : `No entries for this ${view}.`
                }
              />
            ),
          }}
        />
      </Card>

      {/* Add/Edit Entry Modal */}
      <Modal
        title={editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="project_id"
            label="Project"
            rules={[{ required: true, message: 'Please select a project' }]}
          >
            <Select
              placeholder="Select project..."
              options={projects?.map((p: Project) => ({ label: p.name, value: p.id })) || []}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="What did you work on?" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="Start Time"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="End Time"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ background: BRAND.teal }}
              >
                {editingEntry ? 'Update' : 'Add Entry'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


