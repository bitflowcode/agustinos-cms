import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔐 Intentando login con API real...');
      
      const result = await login(values.username, values.password);
      
      if (result.success) {
        message.success('¡Login exitoso! Bienvenido al CMS');
        navigate('/dashboard');
      } else {
        message.error(result.message || 'Error en el login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      message.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>CMS Agustinos</Title>
          <p>Acceso al panel de administración</p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{
            username: 'admin',
            password: 'admin123'
          }}
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: 'Por favor ingresa tu usuario',
              },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Usuario"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: 'Por favor ingresa tu contraseña',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          <p>Credenciales por defecto:</p>
          <p>Usuario: <strong>admin</strong> | Contraseña: <strong>admin123</strong></p>
        </div>
      </Card>
    </div>
  );
};

export default Login;