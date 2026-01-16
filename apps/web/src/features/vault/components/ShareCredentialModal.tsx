import { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Typography, 
  Result, 
  Space, 
  message,
  Divider,
  Alert,
  App
} from 'antd';
import { 
  CopyOutlined, 
  LinkOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Credential } from '@lsm/types';

const { Text } = Typography;

interface ShareCredentialModalProps {
  open: boolean;
  onClose: () => void;
  credential: Credential | null;
}

export function ShareCredentialModal({ open, onClose, credential }: ShareCredentialModalProps) {
  const [form] = Form.useForm();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const { message: antdMessage } = App.useApp ? App.useApp() : { message };

  // Generate Link Mutation
  const shareMutation = useMutation({
    mutationFn: (values: any) => {
      // Direct API call to the new endpoint
      return apiClient.post(`/credentials/${credential?.id}/share`, {
        expires_in_minutes: values.expires_in,
        max_views: values.one_time ? 1 : values.max_views,
        access_password: values.has_password ? values.password : null,
        recipient_email: values.recipient_email,
        note: values.note
      });
    },
    onSuccess: (response) => {
      setGeneratedLink(response.data.data.link);
      setExpiresAt(response.data.data.expires_at);
      antdMessage.success('Secure link generated!');
    },
    onError: () => {
      antdMessage.error('Failed to generate link. Please try again.');
    }
  });

  const handleClose = () => {
    setGeneratedLink(null);
    setExpiresAt(null);
    form.resetFields();
    onClose();
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      antdMessage.success('Link copied to clipboard');
    }
  };

  // Render Result View (Link Generated)
  if (generatedLink) {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose}>Close</Button>
        ]}
        centered
        width={480}
      >
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#8b5cf6' }} />}
          title="Share Link Created!"
          subTitle={`This link will expire on ${new Date(expiresAt!).toLocaleString()}`}
          extra={[
            <div key="link-box" style={{ 
              background: '#1e293b', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #334155',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text ellipsis style={{ maxWidth: 320, color: '#94a3b8' }}>
                {generatedLink}
              </Text>
              <Button 
                type="primary" 
                icon={<CopyOutlined />} 
                onClick={copyToClipboard}
                style={{ background: '#8b5cf6' }}
              >
                Copy
              </Button>
            </div>,
             <Alert
              key="warning"
              message="Security Note"
              description="Anyone with this link can access the credential. Share it securely."
              type="warning"
              showIcon
              style={{ 
                textAlign: 'left', 
                background: '#422006', 
                border: '1px solid #854d0e',
                color: '#fef3c7'
              }}
            />
          ]}
        />
      </Modal>
    );
  }

  // Render Form View
  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />
          <span>Share Credential</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="Generate Link"
      confirmLoading={shareMutation.isPending}
      okButtonProps={{ style: { background: '#8b5cf6' } }}
      centered
      width={500}
    >
      <div style={{ marginBottom: 24 }}>
        <Text type="secondary">
          Generate a secure, time-limited link to share <strong>{credential?.title}</strong>.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          expires_in: 60, // 1 hour
          one_time: true,
          max_views: 5,
          has_password: false
        }}
        onFinish={(values) => shareMutation.mutate(values)}
      >
        <Form.Item label="Link Expiration" name="expires_in" rules={[{ required: true }]}>
          <Select>
            <Select.Option value={60}>1 Hour</Select.Option>
            <Select.Option value={1440}>24 Hours</Select.Option>
            <Select.Option value={4320}>3 Days</Select.Option>
            <Select.Option value={10080}>7 Days</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Maximum Views" style={{ marginBottom: 0 }}>
             <Form.Item name="one_time" valuePropName="checked" style={{ display: 'inline-block', marginRight: 24 }}>
                <Switch checkedChildren="1 View" unCheckedChildren="Custom" />
             </Form.Item>
             <Form.Item 
                shouldUpdate={(prev, curr) => prev.one_time !== curr.one_time}
                noStyle
             >
                   {({ getFieldValue }) => 
                   !getFieldValue('one_time') && (
                      <Form.Item name="max_views" style={{ display: 'inline-block', width: 120, margin: 0 }}>
                         <Input type="number" min={1} max={50} suffix="Views" />
                      </Form.Item>
                   )
                }
             </Form.Item>
        </Form.Item>
        
        <Divider style={{ margin: '16px 0' }} />

        <Form.Item name="has_password" valuePropName="checked" style={{ marginBottom: 12 }}>
           <Switch checkedChildren="Password Protected" unCheckedChildren="No Password" />
        </Form.Item>

        <Form.Item 
           shouldUpdate={(prev, curr) => prev.has_password !== curr.has_password}
           noStyle
        >
           {({ getFieldValue }) => 
              getFieldValue('has_password') && (
                 <Form.Item 
                    name="password" 
                    label="Access Password" 
                    help="Recipient must enter this password to view the credential."
                    rules={[{ required: true, message: 'Please set a password' }]}
                 >
                    <Input.Password placeholder="Set a shared password" />
                 </Form.Item>
              )
           }
        </Form.Item>

        <Form.Item name="recipient_email" label="Recipient Email (Optional)">
           <Input prefix={<LinkOutlined />} placeholder="recipient@example.com" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
