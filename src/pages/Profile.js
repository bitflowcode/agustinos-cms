// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Space, 
  Typography,
  Divider,
  Tag,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined,
  SaveOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, login } = useAuth();

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email
      });
    }
  }, [user, profileForm]);

  // Actualizar perfil (username y email)
  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await axios.put(
        `/api/users?id=${user.id}`,
        {
          username: values.username,
          email: values.email
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('Perfil actualizado exitosamente');
        
        // Actualizar datos en localStorage
        const updatedUser = {
          ...user,
          username: response.data.user.username,
          email: response.data.user.email
        };
        localStorage.setItem('cms_user', JSON.stringify(updatedUser));
        
        // Actualizar contexto (sin cambiar token)
        await login(token, updatedUser);
      } else {
        message.error(response.data.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      message.error(error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await axios.put(
        `/api/users?id=${user.id}&action=password`,
        {
          currentPassword: values.currentPassword,
          password: values.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('Contraseña actualizada exitosamente');
        passwordForm.resetFields();
      } else {
        message.error(response.data.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      message.error(error.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'admin' || role === 'super_admin') return 'Administrador';
    if (role === 'editor') return 'Editor';
    return role;
  };

  const getRoleColor = (role) => {
    if (role === 'admin' || role === 'super_admin') return 'blue';
    if (role === 'editor') return 'green';
    return 'default';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Title level={3}>Mi Perfil</Title>
      <Text type="secondary">Administra tu información personal y contraseña</Text>

      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* Información del perfil */}
        <Col xs={24} lg={12}>
          <Card title="Información Personal" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
              <div>
                <Text type="secondary">Rol</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={getRoleColor(user?.role)} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {getRoleLabel(user?.role)}
                  </Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">Miembro desde</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{new Date(user?.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</Text>
                </div>
              </div>
            </Space>

            <Divider />

            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                name="username"
                label="Nombre de usuario"
                rules={[
                  { required: true, message: 'El nombre de usuario es obligatorio' },
                  { min: 3, message: 'Mínimo 3 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="usuario123"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'El email es obligatorio' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="usuario@ejemplo.com"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={loading}
                  block
                >
                  Guardar Cambios
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Cambiar contraseña */}
        <Col xs={24} lg={12}>
          <Card title="Cambiar Contraseña">
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Por seguridad, necesitas proporcionar tu contraseña actual para cambiarla.
            </Text>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="Contraseña Actual"
                rules={[
                  { required: true, message: 'Ingresa tu contraseña actual' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Tu contraseña actual"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Nueva Contraseña"
                rules={[
                  { required: true, message: 'Ingresa una nueva contraseña' },
                  { min: 6, message: 'Mínimo 6 caracteres' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Confirma tu nueva contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    }
                  })
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Repite la nueva contraseña"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<LockOutlined />}
                  loading={loading}
                  block
                  danger
                >
                  Cambiar Contraseña
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;