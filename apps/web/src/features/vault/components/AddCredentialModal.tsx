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

const { TextArea } = Input;

interface AddCredentialModalProps {
  open: boolean;
  onClose: () => void;
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

export function AddCredentialModal({ open, onClose }: AddCredentialModalProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message: antdMessage } = App.useApp ? App.useApp() : { message };

  // Fetch Projects for Selector
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => api.projects.list().then(r => r.data.data),
    enabled: open
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (values: any) => {
      // Extract metadata
      const { hostname, port, database_name, ...rest } = values;
      const metadata: any = {};
      if (hostname) metadata.hostname = hostname;
      if (port) metadata.port = port;
      if (database_name) metadata.database_name = database_name;

      // Direct implementation using client
      // backend expects POST /api/v1/projects/:id/credentials
      return apiClient.post(`/projects/${values.project_id}/credentials`, {
        ...rest,
        metadata: Object.keys(metadata).length > 0 ? metadata : null
      });
    },
    onSuccess: () => {
      antdMessage.success('Credential added successfully');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      handleClose();
    },
    onError: () => {
      antdMessage.error('Failed to add credential');
    }
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add New Credential"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={createMutation.isPending}
      width={600}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => createMutation.mutate(values)}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="project_id" 
              label="Project" 
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select 
                placeholder="Select Project" 
                loading={isLoadingProjects}
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
           help="e.g., 'Production Server', 'Main DB User'"
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
                                   <Input placeholder="e.g. 192.168.1.1 or db.example.com" />
                                </Form.Item>
                             </Col>
                             <Col span={6}>
                                <Form.Item name="port" label="Port">
                                   <Input placeholder={type === 'ssh' ? '22' : '3306'} />
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
              <Form.Item name="username" label="Username / Login">
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
                    >
                       <Input.Password 
                          placeholder={isApiKey ? "Enter API key" : "Enter password"} 
                          autoComplete="new-password" 
                       />
                    </Form.Item>
                  );
                }}
              </Form.Item>
           </Col>
        </Row>

        <Form.Item name="url" label="Login URL (Optional)">
           <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="note" label="Notes">
           <TextArea rows={3} placeholder="Any additional instructions..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
// Import App to safely use message hook

