import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Modal, Form, Select, DatePicker, Row, Col, Avatar } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, DownOutlined, ExportOutlined, ExclamationCircleOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;
const { confirm } = Modal;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // State cho Modal chỉnh sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const handleLogin = () => {
    if (username === 'admin' && password === '123456') {
      setIsLoggedIn(true);
      fetchData();
    } else { message.error("Sai tài khoản hoặc mật khẩu!"); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (e) { message.error("Không thể tải dữ liệu!"); }
    finally { setLoading(false); }
  };

  // Mở Modal và đổ dữ liệu vào Form (Hình 1)
  const openEditModal = (record) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
    form.setFieldsValue({
      ...record,
      ngaysinh: record.ngaysinh ? dayjs(record.ngaysinh, 'DD/MM/YYYY') : null,
    });
  };

  const handleUpdate = async (values) => {
    try {
      message.loading({ content: "Đang cập nhật...", key: 'up' });
      const updatedData = {
        ...values,
        ngaysinh: values.ngaysinh ? values.ngaysinh.format('DD/MM/YYYY') : '',
      };
      await axios.put(`${SHEETDB_URL}/mahv/${editingRecord.mahv}`, { data: updatedData });
      message.success({ content: "Cập nhật thành công!", key: 'up' });
      setIsEditModalOpen(false);
      fetchData();
    } catch (e) { message.error("Lỗi cập nhật!"); }
  };

  const columns = [
    { 
      title: 'STT', 
      key: 'stt', 
      width: 70, 
      fixed: 'left', 
      // SỬA LỖI: STT tự nhảy theo trang (Page 2 sẽ bắt đầu từ 11 nếu pageSize = 10)
      render: (t, r, index) => {
        const pagination = form.getFieldValue('pagination') || { current: 1, pageSize: 10 };
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      }
    },
    { title: 'Thao Tác', key: 'action', width: 100, fixed: 'left', render: (t, r) => (
      <Space>
        <EditOutlined style={{color:'#1890ff', cursor:'pointer'}} onClick={() => openEditModal(r)} />
        <DeleteOutlined style={{color:'#ff4d4f', cursor:'pointer'}} onClick={() => {}} />
      </Space>
    )},
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130, render: (t) => <b style={{color:'#1d39c4'}}>{t}</b> },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Giới Tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 90 },
    { title: 'Ngày Sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 110 },
    { title: 'Mã Đơn Vị', dataIndex: 'madonvi', key: 'madonvi', width: 150 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Đẳng Cấp', dataIndex: 'capdang', key: 'capdang', width: 100 },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
        <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" alt="logo" style={{ width: 200 }} />
        <h1 style={{ fontWeight: 'bold', fontSize: '24px', marginTop: '10px' }}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</h1>
        <div style={{ width: '350px', marginTop: '30px' }}>
          <Input placeholder="Tên đăng nhập" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} onChange={e => setUsername(e.target.value)} />
          <Input.Password placeholder="Mật khẩu" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '25px' }} onChange={e => setPassword(e.target.value)} />
          <Button type="primary" block onClick={handleLogin} style={{ background: '#3f51b5', height: '40px' }}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Thông Tin Hội Viên</Title>
          <Space>
            <Input prefix={<SearchOutlined />} placeholder="Tìm tên hoặc mã..." style={{ width: 250 }} onChange={e => setSearchText(e.target.value)} allowClear />
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
          </Space>
        </div>
        
        <Table 
          rowSelection={{ selectedRowKeys, onChange: (k) => setSelectedRowKeys(k) }}
          columns={columns} 
          dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
          loading={loading} 
          bordered size="small" scroll={{ x: 1300 }} rowKey="mahv"
          pagination={{ 
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người`,
            onChange: (page, pageSize) => {
                // Ép STT cập nhật lại khi chuyển trang
                form.setFieldValue('pagination', { current: page, pageSize });
            }
          }}
        />
      </div>

      {/* MODAL CHỈNH SỬA (Hình 1) */}
      <Modal
        title="1. Thông tin hội viên"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsEditModalOpen(false)}>Đóng</Button>,
          <Button key="submit" type="primary" style={{background: '#3f51b5'}} onClick={() => form.submit()}>Cập nhật</Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Row gutter={24}>
            <Col span={18}>
              <Checkbox name="hieuluc" defaultChecked>Hiệu lực</Checkbox>
              <Row gutter={16} style={{marginTop: 10}}>
                <Col span={8}>
                  <Form.Item name="mahv" label="Mã hội viên">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="hoten" label="Họ và tên *" rules={[{required: true}]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="ngaysinh" label="Ngày sinh *">
                    <DatePicker format="DD/MM/YYYY" style={{width: '100%'}} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="gioitinh" label="Giới tính *">
                    <Select options={[{value: 'Nam', label: 'Nam'}, {value: 'Nữ', label: 'Nữ'}]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="capdang" label="Đẳng cấp hiện tại *">
                    <Select placeholder="Chọn đẳng cấp" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="phone" label="Số điện thoại *">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                   <Form.Item name="diachi" label="Địa chỉ">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={6} style={{textAlign: 'center'}}>
              <Avatar size={150} icon={<UserOutlined />} shape="square" />
              <Button style={{marginTop: 10}}>Chọn file</Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default App;
