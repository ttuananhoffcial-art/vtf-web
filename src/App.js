import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message, Layout, Typography } from 'antd';
import { GoogleOutlined, FileExcelOutlined, PlusOutlined } from '@ant-design/icons';
import { gapi } from 'gapi-script';

const { Header, Content } = Layout;
const { Title } = Typography;

// CHÈN CLIENT ID CỦA BẠN VÀO ĐÂY
const CLIENT_ID = "1035504074338-l6m3t6e6a6dphhoot6evblgglp84dm4u.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      });
    };
    gapi.load('client:auth2', start);
  }, []);

  // Giao diện bảng dữ liệu chuẩn như lúc chiều
  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 70 },
    { title: 'Mã HV', dataIndex: 'mahv', key: 'mahv' },
    { title: 'Họ và Tên', dataIndex: 'name', key: 'name' },
    { title: 'Số', dataIndex: 'phone', key: 'phone' },
    { title: 'Ngày hết hạn', dataIndex: 'expiry', key: 'expiry' },
    { 
      title: 'Thao tác', 
      key: 'action',
      render: () => <Button type="link">Sửa</Button> 
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>VTF QUẢN LÝ</Title>
        <Button icon={<GoogleOutlined />} onClick={() => message.info('Đang kết nối Google...')}>Kết nối Drive</Button>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: '10px' }}>
            <Input placeholder="Tìm tên hoặc mã hóa..." style={{ width: 250 }} />
            <Button type="primary" icon={<PlusOutlined />}>Thêm mới</Button>
            <Button icon={<FileExcelOutlined />}>Excel</Button>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={data} 
            loading={loading}
            locale={{ emptyText: 'Không có dữ liệu - Vui lòng kết nối Google Sheets' }}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default App;