import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Checkbox, Dropdown, Modal } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, DownOutlined, ExportOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
    } catch (e) { message.error("Không thể tải dữ liệu từ Sheets!"); }
    finally { setLoading(false); }
  };

  // XÓA ĐỒNG BỘ: Xóa trên Web là mất luôn trên Sheets
  const handleDelete = (record) => {
    confirm({
      title: `Xác nhận xóa: ${record.hoten}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Dữ liệu trên Google Sheets sẽ bị xóa vĩnh viễn.',
      okText: 'Xóa ngay',
      cancelText: 'Hủy',
      async onOk() {
        try {
          message.loading({ content: "Đang xóa...", key: 'del' });
          // Lệnh xóa dựa trên Mã Hội Viên (mahv)
          await axios.delete(`${SHEETDB_URL}/mahv/${record.mahv}`);
          message.success({ content: "Đã xóa trên Sheets!", key: 'del' });
          fetchData();
        } catch (e) { message.error("Lỗi xóa dữ liệu!"); }
      },
    });
  };

  const handleExport = () => {
    const dataToExport = selectedRowKeys.length > 0 
      ? dataSource.filter((_, i) => selectedRowKeys.includes(i)) 
      : dataSource;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VTF");
    XLSX.writeFile(workbook, "Danh_Sach_VTF.xlsx");
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 60, fixed: 'left', render: (t, r, i) => i + 1 },
    { title: 'Thao Tác', key: 'action', width: 100, fixed: 'left', render: (t, r) => (
      <Space>
        <EditOutlined style={{color:'#1890ff'}} onClick={() => message.info("Đang phát triển...")} />
        <DeleteOutlined style={{color:'#ff4d4f'}} onClick={() => handleDelete(r)} />
      </Space>
    )},
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130, render: (t) => <b style={{color:'#1d39c4'}}>{t}</b> },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Giới Tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 90 },
    { title: 'Ngày Sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 110 },
    { title: 'Mã Đơn Vị', dataIndex: 'madonvi', key: 'madonvi', width: 150 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Cấp Đẳng', dataIndex: 'capdang', key: 'capdang', width: 100 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 100 },
    { title: 'Mã GSGK', dataIndex: 'magsgk', key: 'magsgk', width: 100 },
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
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Danh sách hội viên</Title>
          <Space>
            <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm nhanh..." style={{ width: 250 }} onChange={e => setSearchText(e.target.value)} allowClear />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info("Tính năng Thêm đang cập nhật")}>Thêm mới</Button>
            <Dropdown menu={{ items: [{ key: 'exp', label: 'Xuất Excel đã chọn', icon: <ExportOutlined />, onClick: handleExport }] }}>
              <Button icon={<DownOutlined />}>Hành động</Button>
            </Dropdown>
          </Space>
        </div>
        <Table 
          rowSelection={{ selectedRowKeys, onChange: (k) => setSelectedRowKeys(k) }}
          columns={columns} 
          dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
          loading={loading} bordered size="small" scroll={{ x: 1600 }} rowKey={(r, i) => i} 
        />
      </div>
    </div>
  );
};

export default App;
