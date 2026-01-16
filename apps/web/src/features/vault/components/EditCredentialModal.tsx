import { useEffect } from 'react';
import { Modal, Form, Input, Select, Typography, Row, Col, Space, message, App } from 'antd';
import { 
  LockOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api';
import type { Credential } from '@lsm/types';

const { TextArea } = Input;
const { Text } = Typography;

interface EditCredentialModalProps {
  open: boolean;
  onClose: () => void;
  credential: Credential | null;
}

const typeOptions = [
  { label: 'WordPress', value: 'wordpress', icon: <GlobalOutlined /> },
  { label: 'SSH', value: 'ssh', icon: <CloudServerOutlined /> },
  { label: 'FTP', value: 'ftp', icon: <CloudServerOutlined /> },
  { label: 'Database', value: 'database', icon: <DatabaseOutlined /> },
  { label: 'Hosting', value: 'hosting', icon: <CloudServerOutlined /> },
  { label: 'Email', value: 'email', icon: <UserOutlined /> },
  { label: 'API Key', value: 'api', icon: <KeyOutlined /> },
  { label: 'Other', value: 'other', icon: <LockOutlined /> },
];

export function EditCredentialModal({ open, onClose, credential }: EditCredentialModalProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message: antdMessage } = App.useApp ? App.useApp() : { message };

  // Fetch Projects to show name (optional, editing project not strictly required but good to have)
  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => api.projects.list().then(r => r.data.data),
    enabled: open
  });

  useEffect(() => {
    if (open && credential) {
      // Flatten metadata for form
      const metadata = credential.metadata || {};
      form.setFieldsValue({
        ...credential,
        project_id: credential.project_id,
        // Spread metadata keys into form (hostname, port, etc.)
        ...metadata
      });
    }
  }, [open, credential, form]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      // Extract metadata known keys
      const { hostname, port, database_name, ...rest } = values;
      const metadata: any = {};
      if (hostname) metadata.hostname = hostname;
      if (port) metadata.port = port;
      if (database_name) metadata.database_name = database_name;

      // Ensure we keep existing metadata if not overwritten? 
      // For now, form values control the state.

      return apiClient.put(`/credentials/${credential?.id}`, {
        ...rest,
        metadata: Object.keys(metadata).length > 0 ? metadata : null
      });
    },
    onSuccess: () => {
      antdMessage.success('Credential updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      handleClose();
    },
    onError: () => {
      antdMessage.error('Failed to update credential');
    }
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Edit Credential"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={updateMutation.isPending}
      width={600}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => updateMutation.mutate(values)}
      >
        {/* Project (Read-only for now or editable) - Let's allow edit */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="project_id" 
              label="Project" 
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select 
                placeholder="Select Project" 
                showSearch
                optionFilterProp="label"
                options={projectsData?.map((p: any) => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item 
              name="type" 
              label="Type" 
              rules={[{ required: true, message: 'Please select type' }]}
             >
                <Select placeholder="Select Type">
                   {typeOptions.map(opt => (
                      <Select.Option key={opt.value} value={opt.value}>
                         <Space>{opt.icon} {opt.label}</Space>
                      </Select.Option>
                   ))}
                </Select>
             </Form.Item>
          </Col>
        </Row>

        <Form.Item 
           name="title" 
           label="Title" 
           rules={[{ required: true }]}
        >
           <Input placeholder="Credential Title" />
        </Form.Item>

        <Form.Item 
            noStyle 
            shouldUpdate={(prev, current) => prev.type !== current.type}
        >
            {({ getFieldValue }) => {
                const type = getFieldValue('type');
                return (
                    <>
                       {(type === 'ssh' || type === 'database' || type === 'ftp') && (
                          <Row gutter={16}>
                             <Col span={18}>
                                <Form.Item name="hostname" label="Hostname / IP">
                                   <Input placeholder="e.g. 192.168.1.1" />
                                </Form.Item>
                             </Col>
                             <Col span={6}>
                                <Form.Item name="port" label="Port">
                                   <Input placeholder="22" />
                                </Form.Item>
                             </Col>
                          </Row>
                       )}
                       {type === 'database' && (
                          <Form.Item name="database_name" label="Database Name">
                             <Input placeholder="my_app_db" />
                          </Form.Item>
                       )}
                    </>
                );
            }}
        </Form.Item>

        <Row gutter={16}>
           <Col span={12}>
              <Form.Item name="username" label="Username">
                 <Input autoComplete="off" />
              </Form.Item>
           </Col>
           <Col span={12}>
              <Form.Item 
                noStyle 
                shouldUpdate={(prev, current) => prev.type !== current.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  const isApiKey = type === 'api';
                  return (
                    <Form.Item 
                      name="password" 
                      label={isApiKey ? "API Key" : "Password / API Key"} 
                      extra={<Text type="secondary" style={{ fontSize: 12 }}>Leave blank to keep current</Text>}
                    >
                       <Input.Password 
                          placeholder={isApiKey ? "Enter API key" : "Enter new password"} 
                       />
                    </Form.Item>
                  );
                }}
              </Form.Item>
           </Col>
        </Row>

        <Form.Item name="url" label="Login URL">
           <Input />
        </Form.Item>

        <Form.Item name="note" label="Notes">
           <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
