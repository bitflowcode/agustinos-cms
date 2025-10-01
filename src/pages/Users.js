// src/pages/Users.js
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  message, 
  Popconfirm,
  Tag,
  Typography,
  Card
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LockOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user: currentUser } = useAuth();

  // Cargar usuarios
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        message.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      message.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Abrir modal para editar
  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role
    });
    setModalVisible(true);
  };

  // Abrir modal para cambiar contraseña
  const handleChangePassword = (record) => {
    setEditingUser(record);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // Guardar usuario (crear o editar)
  const handleSave = async (values) => {
    try {
      const token = localStorage.getItem('cms_token');
      
      if (editingUser) {
        // Actualizar usuario existente
        const response = await axios.put(
          `/api/users?id=${editingUser.id}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          message.success('Usuario actualizado exitosamente');
          fetchUsers();
          setModalVisible(false);
        } else {
          message.error(response.data.error || 'Error al actualizar usuario');
        }
      } else {
        // Crear nuevo usuario
        const response = await axios.post(
          '/api/users',
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          message.success('Usuario creado exitosamente');
          fetchUsers();
          setModalVisible(false);
        } else {
          message.error(response.data.error || 'Error al crear usuario');
        }
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      message.error(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  // Cambiar contraseña
  const handleSavePassword = async (values) => {
    try {
      const token = localStorage.getItem('cms_token');
      
      const response = await axios.put(
        `/api/users?id=${editingUser.id}&action=password`,
        { password: values.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('Contraseña actualizada exitosamente');
        setPasswordModalVisible(false);
      } else {
        message.error(response.data.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      message.error(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  // Eliminar usuario
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('cms_token');
      
      const response = await axios.delete(
        `/api/users?id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('Usuario eliminado exitosamente');
        fetchUsers();
      } else {
        message.error(response.data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      message.error(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </Space>
      )
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const color = role === 'admin' || role === 'super_admin' ? 'blue' : 'green';
        const label = role === 'admin' || role === 'super_admin' ? 'Administrador' : 'Editor';
        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Fecha creación',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-ES')
    },
    {
      title: 'Último acceso',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date) => date ? new Date(date).toLocaleString('es-ES') : 'Nunca'
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const isCurrentUser = record.id === currentUser?.id;
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              Editar
            </Button>
            <Button
              type="link"
              icon={<LockOutlined />}
              onClick={() => handleChangePassword(record)}
              size="small"
            >
              Contraseña
            </Button>
            <Popconfirm
              title="¿Eliminar este usuario?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleDelete(record.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              disabled={isCurrentUser}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={isCurrentUser}
              >
                Eliminar
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestión de Usuarios</Title>
            <Text type="secondary">Administra los usuarios del CMS</Text>
          </div>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Crear Usuario
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} usuarios`
          }}
        />
      </Card>

      {/* Modal Crear/Editar Usuario */}
      <Modal
        title={editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="username"
            label="Nombre de usuario"
            rules={[
              { required: true, message: 'El nombre de usuario es obligatorio' },
              { min: 3, message: 'Mínimo 3 caracteres' }
            ]}
          >
            <Input placeholder="usuario123" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'El email es obligatorio' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input placeholder="usuario@ejemplo.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'La contraseña es obligatoria' },
                { min: 6, message: 'Mínimo 6 caracteres' }
              ]}
            >
              <Input.Password placeholder="Mínimo 6 caracteres" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Selecciona un rol' }]}
            initialValue="editor"
          >
            <Select>
              <Option value="super_admin">Super Admin</Option>
              <Option value="admin">Administrador</Option>
              <Option value="editor">Editor</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleSavePassword}
        >
          <Form.Item
            name="password"
            label="Nueva contraseña"
            rules={[
              { required: true, message: 'La contraseña es obligatoria' },
              { min: 6, message: 'Mínimo 6 caracteres' }
            ]}
          >
            <Input.Password placeholder="Mínimo 6 caracteres" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar contraseña"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirma la contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                }
              })
            ]}
          >
            <Input.Password placeholder="Repite la contraseña" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPasswordModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Cambiar Contraseña
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;