import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, message, Layout, Typography, Space, Card, Tag, Popconfirm, Upload } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LogoutOutlined, ImportOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';

const { Header, Content } = Layout;
const { Title } = Typography;

// --- CẤU HÌNH ---
const SHEETDB_URL = 'https://sheetdb.io/api/v1/u5z5e0w7q3p2b'; // Link kết nối Google Sheets của bạn
const LOGIN_PASSWORD = '123456'; // Mật khẩu đăng nhập của bạn

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  // 1. Kiểm tra đăng nhập
  const handleLogin = () => {
    if (password === LOGIN_PASSWORD) {
      setIsLoggedIn(true);
      message.success('Đăng nhập thành công!');
      fetchData();
    } else {
      message.error('Sai mật khẩu!');
    }
  };

  // 2. Lấy dữ liệu từ Google Sheets
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(res.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu!');
    }
    setLoading(false);
  };

  // 3. Thêm hoặc Sửa hội viên
  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`${SHEETDB_URL}/mahv/${editingItem.mahv}`, { data: values });
        message.success('Cập nhật thành công!');
      } else {
        await axios.post(SHEETDB_URL, { data: values });
        message.success('Thêm mới thành công!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Lỗi khi lưu dữ liệu!');
    }
    setLoading(false);
  };

  // 4. Xóa hội viên
  const handleDelete = async (mahv) => {
    try {
      await axios.delete(`${SHEETDB_URL}/mahv/${mahv}`);
      message.success('Đã xóa hội viên!');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa!');
    }
  };

  // 5. Nhập dữ liệu từ file Excel
  const handleImportExcel = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      if (parsedData.length > 0) {
        message.loading({ content: 'Đang lưu dữ liệu...', key: 'up' });
        try {
          await axios.post(SHEETDB_URL, { data: parsedData });
          message.success({ content: 'Nhập Excel thành công!', key: 'up' });
          fetchData();
        } catch (err) {
          message.error({ content: 'Lỗi khi lưu Excel!', key: 'up' });
        }
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  // Lọc dữ liệu theo ô tìm kiếm
  const filteredData = dataSource.filter(item => 
    (item.hoten || "").toLowerCase().includes(searchText.toLowerCase()) ||
    (item.mahv || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'STT', key: 'stt', width: 60, render: (_, __, index) => index + 1 },
    { title: 'Mã HV', dataIndex: 'mahv', key: 'mahv' },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten' },
    { title: 'Số ĐT', dataIndex: 'sodt', key: 'sodt' },
    { title: 'Ngày hết hạn', dataIndex: 'ngayhet', key: 'ngayhet', render: (text) => <Tag color="blue">{text}</Tag> },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { setEditingItem(record); form.setFieldsValue(record); setIsModalOpen(true); }} />
          <Popconfirm title="Xóa hội viên này?" onConfirm={() => handleDelete(record.mahv)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
        <Card title={<Title level={3} style={{ textAlign: 'center' }}>VTF QUẢN LÝ</Title>} style={{ width: 350, textAlign: 'center', borderRadius: 15 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.Password 
              prefix={<KeyOutlined />} 
              placeholder="Nhập mật khẩu" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              onPressEnter={handleLogin}
            />
            <Button type="primary" block onClick={handleLogin}>ĐĂNG NHẬP</Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>VTF MANAGEMENT</Title>
        <Button danger icon={<LogoutOutlined />} onClick={() => setIsLoggedIn(false)}>Thoát</Button>
      </Header>
      <Content style={{ padding: '20px' }}>
        <Card style={{ borderRadius: 10 }}>
          <Space wrap style={{ marginBottom: 20 }}>
            <Input 
              placeholder="Tìm tên hoặc mã hội viên..." 
              prefix={<SearchOutlined />} 
              style={{ width: 250 }} 
              onChange={e => setSearchText(e.target.value)} 
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }}>Thêm mới</Button>
            <Upload beforeUpload={handleImportExcel} showUploadList={false}>
              <Button icon={<ImportOutlined />}>Nhập Excel</Button>
            </Upload>
          </Space>

          <Table 
            columns={columns} 
            dataSource={filteredData} 
            loading={loading} 
            rowKey="mahv" 
            scroll={{ x: 600 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Content>

      <Modal 
        title={editingItem ? "Cập nhật hội viên" : "Thêm hội viên mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="mahv" label="Mã hội viên" rules={[{ required: true }]}>
            <Input disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="hoten" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sodt" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="ngayhet" label="Ngày hết hạn (dd/mm/yyyy)">
            <Input placeholder="Ví dụ: 31/12/2026" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;