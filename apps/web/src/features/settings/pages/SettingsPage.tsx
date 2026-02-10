/**
 * Admin Settings Page
 * 
 * Admin-only page for configuring global application settings.
 * Includes uptime monitoring configuration, backup storage & schedule settings.
 */

import { useEffect } from 'react';
import { Card, Typography, Switch, Select, InputNumber, Form, Button, Row, Col, Space, Divider, App, Spin, Alert, Tag } from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  SaveOutlined,
  ReloadOutlined,
  HddOutlined,
  CloudUploadOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/theme';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const { Title, Text } = Typography;

interface BackupConfig {
  driver: string;
  available_drivers: string[];
  retention: {
    max_backups: number;
    max_age_days: number;
    min_backups: number;
  };
  schedule: {
    enabled: boolean;
    frequency: string;
    time: string;
    day_of_week: number;
  };
  defaults: {
    includes_database: boolean;
    includes_files: boolean;
    includes_uploads: boolean;
  };
}

const driverIcons: Record<string, React.ReactNode> = {
  local: <HddOutlined />,
  s3: <CloudUploadOutlined />,
  gcs: <CloudUploadOutlined />,
  gdrive: <GoogleOutlined />,
};

const driverLabels: Record<string, string> = {
  local: 'Local Storage (Server)',
  s3: 'Amazon S3',
  gcs: 'Google Cloud Storage',
  gdrive: 'Google Drive',
};

export function SettingsPage() {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Redirect non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, navigate]);

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then(r => r.data?.data || r.data),
    enabled: isAdmin,
  });

  // Fetch backup config (storage location, schedule, retention, defaults)
  const { data: backupConfig, isLoading: loadingBackupConfig } = useQuery<BackupConfig>({
    queryKey: ['backup-settings'],
    queryFn: () => apiClient.get('/backups/settings').then(r => r.data?.data || r.data),
    enabled: isAdmin,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        'uptime.enabled': settings.uptime?.enabled ?? true,
        'uptime.interval': settings.uptime?.interval ?? 5,
        'uptime.concurrency': settings.uptime?.concurrency ?? 10,
        'uptime.timeout': settings.uptime?.timeout ?? 15,
        'backup.default_frequency': settings.backup?.default_frequency ?? 'daily',
        'backup.retention_days': settings.backup?.retention_days ?? 30,
      });
    }
  }, [settings, form]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        uptime: {
          enabled: values['uptime.enabled'],
          interval: values['uptime.interval'],
          concurrency: values['uptime.concurrency'],
          timeout: values['uptime.timeout'],
        },
        backup: {
          default_frequency: values['backup.default_frequency'],
          retention_days: values['backup.retention_days'],
        },
      };
      return apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      message.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleSave = (values: any) => {
    saveMutation.mutate(values);
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Alert
          type="error"
          message="Access Denied"
          description="You don't have permission to access this page."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Alert
          type="error"
          message="Failed to load settings"
          description="Please try refreshing the page."
        />
      </div>
    );
  }

  const cardStyle = {
    borderRadius: 12,
    background: isDark ? '#1e293b' : '#fff',
  };

  const inputHeight = 40;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 12 }} />
          Settings
        </Title>
        <Text type="secondary">
          Configure global application settings. Changes apply immediately.
        </Text>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          'uptime.enabled': true,
          'uptime.interval': 5,
          'uptime.concurrency': 10,
          'uptime.timeout': 15,
          'backup.default_frequency': 'daily',
          'backup.retention_days': 30,
        }}
      >
        {/* Uptime Monitoring Settings */}
        <Card
          title={
            <Space>
              <ThunderboltOutlined style={{ color: '#f59e0b' }} />
              <span>Uptime Monitoring</span>
            </Space>
          }
          style={{ ...cardStyle, marginBottom: 24 }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="uptime.enabled"
                label="Automatic Monitoring"
                valuePropName="checked"
                tooltip={{ title: "Enable or disable automatic uptime checks for all projects", color: isDark ? '#334155' : undefined }}
              >
                <Switch
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="uptime.interval"
                label="Check Interval"
                tooltip={{ title: "How often to check sites (in minutes)", color: isDark ? '#334155' : undefined }}
              >
                <Select
                  style={{ height: inputHeight }}
                  options={[
                    { value: 1, label: 'Every 1 minute' },
                    { value: 2, label: 'Every 2 minutes' },
                    { value: 3, label: 'Every 3 minutes' },
                    { value: 5, label: 'Every 5 minutes (Recommended)' },
                    { value: 10, label: 'Every 10 minutes' },
                    { value: 15, label: 'Every 15 minutes' },
                    { value: 30, label: 'Every 30 minutes' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="uptime.concurrency"
                label="Concurrency"
                tooltip={{ title: "Number of sites to check simultaneously", color: isDark ? '#334155' : undefined }}
              >
                <InputNumber
                  min={1}
                  max={50}
                  style={{ width: '100%', height: inputHeight }}
                  addonAfter="sites at once"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="uptime.timeout"
                label="Request Timeout"
                tooltip={{ title: "How long to wait for a response before marking site as down", color: isDark ? '#334155' : undefined }}
              >
                <InputNumber
                  min={5}
                  max={60}
                  style={{ width: '100%', height: inputHeight }}
                  addonAfter="seconds"
                />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Tip: For ~200 sites with concurrency of 15 and 5-minute interval, checks complete in ~2-3 minutes.
          </Text>
        </Card>

        {/* Backup Settings - Full Configuration */}
        <Card
          title={
            <Space>
              <CloudOutlined style={{ color: '#3b82f6' }} />
              <span>Backup Settings</span>
            </Space>
          }
          style={{ ...cardStyle, marginBottom: 24 }}
          loading={loadingBackupConfig}
        >
          {/* Storage Location (read-only, from config) */}
          {backupConfig && (
            <>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Storage Location</Text>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {backupConfig.available_drivers.map((driver) => (
                  <Card
                    key={driver}
                    size="small"
                    style={{
                      width: 180,
                      cursor: 'default',
                      borderColor: backupConfig.driver === driver ? '#1890ff' : undefined,
                      background: backupConfig.driver === driver ? (isDark ? '#1e3a5f' : '#e6f7ff') : undefined,
                    }}
                  >
                    <Space>
                      {driverIcons[driver]}
                      <div>
                        <Text strong style={{ display: 'block' }}>{driverLabels[driver] || driver}</Text>
                        {backupConfig.driver === driver && (
                          <Tag color="blue" style={{ marginTop: 4 }}>Active</Tag>
                        )}
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>
              <Alert
                type="info"
                message="Storage driver is configured via environment variables (.env). Change BACKUP_DRIVER to switch."
                style={{ marginBottom: 20, borderRadius: 8 }}
                showIcon
              />
              <Divider />
            </>
          )}

          {/* Editable settings */}
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="backup.default_frequency"
                label="Default Frequency"
                tooltip={{ title: "Default backup frequency for new projects", color: isDark ? '#334155' : undefined }}
              >
                <Select
                  style={{ height: inputHeight }}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="backup.retention_days"
                label="Retention Period"
                tooltip={{ title: "How long to keep backups before automatic deletion", color: isDark ? '#334155' : undefined }}
              >
                <InputNumber
                  min={1}
                  max={365}
                  style={{ width: '100%', height: inputHeight }}
                  addonAfter="days"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Read-only config summary */}
          {backupConfig && (
            <>
              <Divider />
              <Row gutter={[24, 16]}>
                {/* Schedule Status */}
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>Scheduled Backups</Text>
                      <Tag color={backupConfig.schedule.enabled ? 'green' : 'default'}>
                        {backupConfig.schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Tag>
                    </div>
                    <Space size={24}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Frequency</Text>
                        <div style={{ textTransform: 'capitalize' }}>
                          <Text strong>{backupConfig.schedule.frequency}</Text>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Time</Text>
                        <div>
                          <Text strong>{backupConfig.schedule.time}</Text>
                        </div>
                      </div>
                    </Space>
                  </div>
                </Col>

                {/* Retention Policy */}
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Retention Policy</Text>
                    <Space size={24}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Max Backups</Text>
                        <Text strong style={{ fontSize: 18 }}>{backupConfig.retention.max_backups}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Max Age</Text>
                        <Text strong style={{ fontSize: 18 }}>{backupConfig.retention.max_age_days || '∞'} days</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Min Keep</Text>
                        <Text strong style={{ fontSize: 18 }}>{backupConfig.retention.min_backups}</Text>
                      </div>
                    </Space>
                  </div>
                </Col>
              </Row>

              {/* Default Contents */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Default Backup Contents</Text>
                <Space>
                  <Tag color={backupConfig.defaults.includes_database ? 'green' : 'default'}>
                    Database {backupConfig.defaults.includes_database ? '✓' : '✗'}
                  </Tag>
                  <Tag color={backupConfig.defaults.includes_files ? 'green' : 'default'}>
                    Files {backupConfig.defaults.includes_files ? '✓' : '✗'}
                  </Tag>
                  <Tag color={backupConfig.defaults.includes_uploads ? 'green' : 'default'}>
                    Uploads {backupConfig.defaults.includes_uploads ? '✓' : '✗'}
                  </Tag>
                </Space>
              </div>
            </>
          )}
        </Card>

        {/* Save Button */}
        <Row justify="end">
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.resetFields();
                queryClient.invalidateQueries({ queryKey: ['settings'] });
              }}
            >
              Reset
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              Save Settings
            </Button>
          </Space>
        </Row>
      </Form>
    </div>
  );
}

export default SettingsPage;
