import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Dropdown, Upload, message, Input } from 'antd';
import { 
  DownOutlined, ExportOutlined, ImportOutlined, 
  FileTextOutlined, EditOutlined, DeleteOutlined, SearchOutlined 
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;

const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadTemplate = () => {
    const headers = [
      "STT", "Mã hội viên", "Họ và tên", "Hiệu lực", "Ngày tháng năm sinh dd/mm/yyyy", 
      "Giới tính (Nam/Nữ)", "Số điện thoại", "CMND/CCCD", "Trình độ văn hóa", "Email", 
      "Mã đơn vị", "Tổ chức thành viên", "Mã CLB", "CLB/ Võ đường", "Mã HLV", 
      "Mã Trọng tài", "Số VB Kukkiwon", "Ngày tham gia", "Địa chỉ", "Ghi chú", 
      "Mã GAL", "Mã GSGK", "Cấp / Đẳng", "Mã hội viên (cũ)"
    ];
    const templateData = [{ "STT": 1, "Mã hội viên": "V24-001", "Họ và tên": "Nguyễn Văn A", "Cấp / Đẳng": "Cấp 10" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DANH SÁCH HỘI VIÊN");
    XLSX.writeFile(workbook, "FILE_MAU_IMPORT_HOI_VIEN.xlsx");
    message.success("Đang tải file mẫu chuẩn...");
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const cleanedData = rawData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
            if (cleanKey.includes('mahoivien')) newRow['mahv'] = row[key];
            else if (cleanKey.includes('hoten')) newRow['hoten'] = row[key];
            else if (cleanKey.includes('ngaysinh') || cleanKey.includes('ngaythang')) {
                let val = row[key];
                if (val instanceof Date) {
                  newRow['ngaysinh'] = val.toLocaleDateString('vi-VN');
                } else if (!isNaN(val)) { // Xử lý nếu Excel vẫn trả về số
                  const date = new Date((val - 25569) * 86400 * 1000);
                  newRow['ngaysinh'] = date.toLocaleDateString('vi-VN');
                } else {
                  newRow['ngaysinh'] = val;
                }
            }
            else if (cleanKey.includes('gioitinh')) newRow['gioitinh'] = row[key];
            else if (cleanKey.includes('madonvi')) newRow['madonvi'] = row[key];
            else if (cleanKey.includes('maclb')) newRow['maclb'] = row[key];
            else if (cleanKey.includes('tenclb') || cleanKey.includes('clbvod')) newRow['tenclb'] = row[key];
            else if (cleanKey.includes('capdang') || cleanKey.includes('capdo')) newRow['capdang'] = row[key];
            else if (cleanKey.includes('magal')) newRow['magal'] = row[key];
          });
          return newRow;
        });

        if (cleanedData.length > 0) {
          message.loading({ content: 'Đang lưu...', key: 'up' });
          await axios.post(SHEETDB_URL, { data: cleanedData });
          message.success({ content: 'Import thành công!', key: 'up' });
          fetchData();
        }
      } catch (error) {
        message.error({ content: 'Lỗi Import!', key: 'up' });
      }
    };
    reader.readAsBinaryString(file);
    return false; 
  };

  const filteredData = dataSource.filter(item => {
    const search = searchText.toLowerCase();
    const name = (item.hoten || "").toLowerCase();
    const code = (item.mahv || "").toLowerCase();
    return name.includes(search) || code.includes(search);
  });

  const columns = [
    { title: 'STT', key: 'stt', width: 60, fixed: 'left', render: (text, record, index) => index + 1 },
    { title: 'Thao Tác', key: 'action', width: 100, fixed: 'left', render: () => <Space><EditOutlined style={{color:'#1890ff'}} /><DeleteOutlined style={{color:'#ff4d4f'}}/></Space> },
    { title: 'Mã Hội viên', dataIndex: 'mahv', key: 'mahv', width: 120, render: (text) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span> },
    { title: 'Họ Và Tên', dataIndex: 'hoten', key: 'hoten', width: 200 },
    { title: 'Giới Tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 100 },
    { title: 'Ngày Sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 120 },
    { title: 'Mã Đơn Vị', dataIndex: 'madonvi', key: 'madonvi', width: 120 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 120 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 220 },
    { title: 'Cấp Đẳng', dataIndex: 'capdang', key: 'capdang', width: 120 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 120 },
  ];

  const items = [{ key: '1', label: 'Xuất Excel', icon: <ExportOutlined /> }, { key: '2', label: 'Download file mẫu', icon: <FileTextOutlined />, onClick: downloadTemplate }, { type: 'divider' }, { key: '3', label: (<Upload beforeUpload={handleImport} showUploadList={false}><span style={{ color: 'red' }}>Import Excel (Thêm mới)</span></Upload>), icon: <ImportOutlined style={{ color: 'red' }} /> }];

  return (
    <Layout style={{ padding: '20px', background: '#fff', minHeight: '100vh' }}>
      <Content>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Danh hiệu của thành viên</Title>
          <Space size="middle">
            <Input placeholder="Tìm Mã hội viên hoặc Họ tên..." prefix={<SearchOutlined />} style={{ width: 350, height: '40px' }} onChange={(e) => setSearchText(e.target.value)} allowClear />
            <Dropdown menu={{ items }} placement="bottomRight"><Button type="primary" style={{ background: '#2f54eb', height: '40px' }}>Hành động <DownOutlined /></Button></Dropdown>
          </Space>
        </div>
        <Table columns={columns} dataSource={filteredData} loading={loading} bordered size="small" scroll={{ x: 1600 }} rowKey={(record, index) => index} pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '50', '100'], showTotal: (total) => `Tổng số: ${total} hội viên` }} />
      </Content>
    </Layout>
  );
};

export default App;