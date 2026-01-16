/**
 * Approvals Page
 *
 * PM/Manager view to review and approve/reject team timesheets.
 * Now with entry-level selection for partial approval.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Input,
  InputNumber,
  App,
  Empty,
  Avatar,
  Badge,
  Checkbox,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

const BRAND = {
  deepPurple: '#440C71',
  vibrantPurple: '#6B21A8',
  teal: '#3AA68D',
};

interface TimeEntry {
  id: number;
  description: string | null;
  started_at: string;
  duration_minutes: number | null;
  formatted_duration: string;
  hourly_rate?: number | null;
  project?: { id: number; name: string };
  user?: { id: number; name: string; hourly_rate?: number };
}

interface Timesheet {
  id: number;
  user_id: number;
  week_number: number;
  year: number;
  week_label: string;
  status: 'open' | 'submitted' | 'approved' | 'rejected' | 'paid';
  total_minutes: number;
  formatted_total: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  user?: { id: number; name: string; hourly_rate?: number };
  entries?: TimeEntry[];
  entries_count?: number;
}

// Helper to format duration
const formatDuration = (minutes: number): string => {
  const totalMins = Math.round(minutes);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
};

export function ApprovalsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // State
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Entry-level selection
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(new Set());
  // Hourly rate overrides (entryId -> rate)
  const [rateOverrides, setRateOverrides] = useState<Record<number, number>>({});

  // Fetch pending timesheets
  const { data: pendingTimesheets, isLoading } = useQuery({
    queryKey: ['timesheets', 'pending'],
    queryFn: () => api.timesheets.pending().then((r: { data: { success: boolean; data: Timesheet[] } }) => r.data.data),
  });

  // The pending response already includes entries, so use selectedTimesheet directly
  const timesheetDetails = selectedTimesheet;
  const fetchingDetails = false;

  // When timesheet is selected, select all entries by default
  useMemo(() => {
    if (selectedTimesheet?.entries) {
      setSelectedEntryIds(new Set(selectedTimesheet.entries.map((e: TimeEntry) => e.id)));
      // Initialize rate overrides from existing values
      const overrides: Record<number, number> = {};
      selectedTimesheet.entries.forEach((e: TimeEntry) => {
        if (e.hourly_rate) overrides[e.id] = e.hourly_rate;
      });
      setRateOverrides(overrides);
    }
  }, [selectedTimesheet?.entries]);


  // Approve mutation - now uses entry-based endpoint
  const approveMutation = useMutation({
    mutationFn: async ({ entryIds, rateOverrides: rates }: { id: number; entryIds: number[]; rateOverrides?: Record<number, number> }) => {
      const { apiClient } = await import('@/lib/api');
      return apiClient.post('/time-entries/approve', { entry_ids: entryIds, rate_overrides: rates }).then((r: { data: { success: boolean; message?: string } }) => r.data);
    },
    onSuccess: (data: { message?: string }) => {
      message.success(data?.message || 'Selected entries approved!');
      setDetailsOpen(false);
      setSelectedTimesheet(null);
      setSelectedEntryIds(new Set());
      setRateOverrides({});
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to approve');
    },
  });

  // Reject mutation - now uses entry-based endpoint
  const rejectMutation = useMutation({
    mutationFn: async ({ reason, entryIds }: { id: number; reason: string; entryIds?: number[] }) => {
      const { apiClient } = await import('@/lib/api');
      return apiClient.post('/time-entries/reject', { entry_ids: entryIds, reason }).then((r: { data: { success: boolean } }) => r.data);
    },
    onSuccess: () => {
      message.success('Selected entries rejected');
      setRejectOpen(false);
      setDetailsOpen(false);
      setSelectedTimesheet(null);
      setRejectReason('');
      setSelectedEntryIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to reject');
    },
  });

  // View details
  const handleViewDetails = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setDetailsOpen(true);
  };

  // Toggle entry selection
  const toggleEntry = (entryId: number) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleAll = (checked: boolean) => {
    if (checked && timesheetDetails?.entries) {
      setSelectedEntryIds(new Set(timesheetDetails.entries.map((e: TimeEntry) => e.id)));
    } else {
      setSelectedEntryIds(new Set());
    }
  };

  // Update rate override
  const updateRate = (entryId: number, rate: number | null) => {
    setRateOverrides(prev => {
      if (rate === null) {
        const { [entryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [entryId]: rate };
    });
  };

  // Handle approve selected
  const handleApproveSelected = () => {
    if (!selectedTimesheet) return;
    if (selectedEntryIds.size === 0) {
      message.warning('Please select at least one entry to approve');
      return;
    }
    approveMutation.mutate({ 
      id: selectedTimesheet.id, 
      entryIds: Array.from(selectedEntryIds),
      rateOverrides
    });
  };

  // Handle reject selected
  const handleRejectSelected = () => {
    if (!selectedTimesheet) return;
    if (selectedEntryIds.size === 0) {
      message.warning('Please select at least one entry to reject');
      return;
    }
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({ 
      id: selectedTimesheet.id, 
      reason: rejectReason,
      entryIds: Array.from(selectedEntryIds)
    });
  };

  // Get default hourly rate
  const getDefaultRate = (entry: TimeEntry): number => {
    return entry.hourly_rate || timesheetDetails?.user?.hourly_rate || 0;
  };

  // Table columns
  const columns = [
    {
      title: 'Developer',
      key: 'user',
      render: (_: unknown, record: Timesheet) => (
        <Space>
          <Avatar style={{ backgroundColor: BRAND.vibrantPurple }} icon={<UserOutlined />}>
            {record.user?.name?.charAt(0)}
          </Avatar>
          <Text strong>{record.user?.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Week',
      dataIndex: 'week_label',
      key: 'week',
    },
    {
      title: 'Total Time',
      key: 'total',
      render: (_: unknown, record: Timesheet) => (
        <Space>
          <ClockCircleOutlined />
          <Text strong>{record.formatted_total}</Text>
        </Space>
      ),
    },
    {
      title: 'Entries',
      dataIndex: 'entries_count',
      key: 'entries',
      render: (count: number) => <Badge count={count} style={{ backgroundColor: BRAND.teal }} />,
    },
    {
      title: 'Submitted',
      dataIndex: 'submitted_at',
      key: 'submitted',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Timesheet) => (
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Review
        </Button>
      ),
    },
  ];

  // Entry columns for details modal - with checkboxes
  const entryColumns = [
    {
      title: (
        <Checkbox
          checked={selectedEntryIds.size === (timesheetDetails?.entries?.length || 0) && selectedEntryIds.size > 0}
          indeterminate={selectedEntryIds.size > 0 && selectedEntryIds.size < (timesheetDetails?.entries?.length || 0)}
          onChange={(e) => toggleAll(e.target.checked)}
        />
      ),
      key: 'select',
      width: 40,
      render: (_: unknown, record: TimeEntry) => (
        <Checkbox
          checked={selectedEntryIds.has(record.id)}
          onChange={() => toggleEntry(record.id)}
        />
      ),
    },
    {
      title: 'Project',
      key: 'project',
      render: (_: unknown, record: TimeEntry) => (
        <Tag color={BRAND.vibrantPurple}>{record.project?.name}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <Text type="secondary">No description</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'started_at',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: unknown, record: TimeEntry) => (
        <Text strong>{record.duration_minutes ? formatDuration(record.duration_minutes) : record.formatted_duration}</Text>
      ),
    },
    {
      title: 'Rate ($/hr)',
      key: 'rate',
      width: 120,
      render: (_: unknown, record: TimeEntry) => (
        <InputNumber
          size="small"
          min={0}
          step={5}
          style={{ width: 90 }}
          value={rateOverrides[record.id] ?? getDefaultRate(record)}
          onChange={(value) => updateRate(record.id, value)}
          prefix={<DollarOutlined />}
        />
      ),
    },
  ];

  // Calculate selected totals
  const selectedTotals = useMemo(() => {
    if (!timesheetDetails?.entries) return { minutes: 0, cost: 0 };
    
    let minutes = 0;
    let cost = 0;
    
    timesheetDetails.entries.forEach((entry: TimeEntry) => {
      if (selectedEntryIds.has(entry.id)) {
        const mins = entry.duration_minutes || 0;
        const rate = rateOverrides[entry.id] ?? getDefaultRate(entry);
        minutes += mins;
        cost += (mins / 60) * rate;
      }
    });
    
    return { minutes, cost };
  }, [timesheetDetails?.entries, selectedEntryIds, rateOverrides]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{t('approvals.title')}</Title>
        <Text type="secondary">{t('approvals.subtitle')}</Text>
      </div>

      {/* Pending count */}
      {pendingTimesheets && pendingTimesheets.length > 0 && (
        <Card style={{ marginBottom: 16, background: `${BRAND.vibrantPurple}10`, border: `1px solid ${BRAND.vibrantPurple}30` }}>
          <Space>
            <Badge count={pendingTimesheets.length} style={{ backgroundColor: BRAND.vibrantPurple }} />
            <Text>timesheets awaiting your approval</Text>
          </Space>
        </Card>
      )}

      {/* Timesheets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={pendingTimesheets || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('approvals.noApprovals')}
              />
            ),
          }}
        />
      </Card>

      {/* Details Modal with Entry Selection */}
      <Modal
        title={
          <Space>
            <Avatar style={{ backgroundColor: BRAND.vibrantPurple }} icon={<UserOutlined />}>
              {timesheetDetails?.user?.name?.charAt(0)}
            </Avatar>
            <span>{timesheetDetails?.user?.name}'s Timesheet</span>
            <Tag>{timesheetDetails?.week_label}</Tag>
          </Space>
        }
        open={detailsOpen}
        onCancel={() => {
          setDetailsOpen(false);
          setSelectedTimesheet(null);
          setSelectedEntryIds(new Set());
        }}
        width={900}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Text type="secondary">
                Selected: {selectedEntryIds.size} entries • {formatDuration(selectedTotals.minutes)} • 
                <Text strong style={{ color: BRAND.teal }}> ${selectedTotals.cost.toFixed(2)}</Text>
              </Text>
            </div>
            <Space>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectOpen(true)}
                disabled={selectedEntryIds.size === 0}
              >
                Reject Selected ({selectedEntryIds.size})
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApproveSelected}
                loading={approveMutation.isPending}
                disabled={selectedEntryIds.size === 0}
                style={{ background: BRAND.teal }}
              >
                Approve Selected ({selectedEntryIds.size})
              </Button>
            </Space>
          </Space>
        }
      >
        {/* Summary */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space size="large">
            <div>
              <Text type="secondary">Total Time</Text>
              <div>
                <Text strong style={{ fontSize: 20 }}>{timesheetDetails?.formatted_total}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Entries</Text>
              <div>
                <Text strong style={{ fontSize: 20 }}>{timesheetDetails?.entries?.length || 0}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Default Rate</Text>
              <div>
                <Text strong style={{ fontSize: 20 }}>${timesheetDetails?.user?.hourly_rate || 0}/hr</Text>
              </div>
            </div>
          </Space>
        </Card>

        {/* Entries Table with Checkboxes */}
        <Table
          columns={entryColumns}
          dataSource={timesheetDetails?.entries || []}
          rowKey="id"
          loading={fetchingDetails}
          pagination={false}
          size="small"
          rowClassName={(record: TimeEntry) => 
            selectedEntryIds.has(record.id) ? 'ant-table-row-selected' : ''
          }
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Selected Entries"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onOk={handleRejectSelected}
        okText={`Reject ${selectedEntryIds.size} Entries`}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
      >
        <Paragraph type="secondary">
          Please provide a reason for rejecting {selectedEntryIds.size} entries. The developer will be notified.
        </Paragraph>
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
